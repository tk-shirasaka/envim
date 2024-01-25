import React, { createRef, RefObject, MouseEvent, WheelEvent } from "react";

import { ICell, IScroll, ITab, IBuffer, IMode } from "common/interface";

import { Emit } from "../../utils/emit";
import { Setting } from "../../utils/setting";
import { Canvas } from "../../utils/canvas";
import { Cache } from "../../utils/cache";
import { y2Row, x2Col } from "../../utils/size";

import { FlexComponent } from "../flex";
import { IconComponent } from "../icon";
import { MenuComponent } from "../menu";
import { WebviewComponent } from "../webview";

interface Props {
  id: string;
  gid: number;
  winid: number;
  focusable: boolean;
  focus: boolean;
  type: "normal" | "floating" | "external";
  mousemoveevent: boolean;
  style: {
    zIndex: number;
    width: number;
    height: number;
    transform: string;
    visibility: "visible" | "hidden";
  };
}

interface States {
  bufs: IBuffer[];
  nomouse: boolean;
  dragging: boolean;
  scrolling: number;
  preview: { src: string; active: number; };
  scroll: {
    total: number;
    height: string;
    transform: string;
  };
}

const TYPE = "editor";

export class EditorComponent extends React.Component<Props, States> {
  private canvas: RefObject<HTMLCanvasElement> = createRef<HTMLCanvasElement>();
  private timer: number = 0;
  private drag: boolean = false;
  private busy: boolean = false;
  private pointer: { row: number; col: number } = { row: 0, col: 0 };
  private dragging: { x: number; y: number } = { x: 0, y: 0 };
  private delta: { x: number; y: number } = { x: 0, y: 0 };
  private update: boolean = false;

  constructor(props: Props) {
    super(props);

    this.busy = Cache.get<boolean>(TYPE, "busy");
    this.state = { bufs: Cache.get<IBuffer[]>(TYPE, "bufs") || [], nomouse: Cache.get<boolean>(TYPE, "nomouse"), dragging: false, scrolling: 0, preview: { src: "", active: 0 }, scroll: { total: 0, height: "100%", transform: "" } };
    Emit.on(`clear:${this.props.id}`, this.onClear);
    Emit.on(`flush:${this.props.id}`, this.onFlush);
    Emit.on(`preview:${this.props.id}`, this.onPreview);
    Emit.on(`viewport:${this.props.id}`, this.onViewport);
    Emit.on("envim:drag", this.onDrag);
    Emit.on("grid:busy", this.onBusy);
    Emit.on("mode:change", this.changeMode);
    Emit.on("tabline:update", this.onTabline);
  }

  componentDidMount() {
    const ctx = this.canvas.current?.getContext("2d");

    if (this.canvas.current && ctx) {
      Canvas.create(this.props.id, this.canvas.current, ctx, this.props.type === "normal");
      Emit.send("envim:ready", this.props.gid);
    }
  }

  componentDidUpdate() {
    if (this.update) {
      this.update = false;
      Canvas.update(this.props.id, this.props.type === "normal");
      Emit.send("envim:ready", this.props.gid);
    }
  }

  componentWillUnmount = () => {
    clearInterval(this.timer);
    Canvas.delete(this.props.id);
    Emit.off(`clear:${this.props.id}`, this.onClear);
    Emit.off(`flush:${this.props.id}`, this.onFlush);
    Emit.off(`preview:${this.props.id}`, this.onPreview);
    Emit.off(`viewport:${this.props.id}`, this.onViewport);
    Emit.off("envim:drag", this.onDrag);
    Emit.off("grid:busy", this.onBusy);
    Emit.off("mode:change", this.changeMode);
    Emit.off("tabline:update", this.onTabline);
  }

  shouldComponentUpdate(props: Props) {
    const prev = this.props;
    const next = props;
    if (prev.style.width !== next.style.width || prev.style.height !== next.style.height) {
      this.update = true;
    }
    return true;
  }

  private runCommand(e: MouseEvent, command: string) {
    e.stopPropagation();
    e.preventDefault();

    command && Emit.send("envim:api", "nvim_call_function", ["win_execute", [this.props.winid, command]]);
  }

  private onMouseEvent(e: MouseEvent, action: string, button: string = "") {
    button = button || ["left", "middle", "right"][e.button] || "left";

    const [col, row] = [ x2Col(e.nativeEvent.offsetX), y2Row(e.nativeEvent.offsetY) ];
    const modiffier = [];
    const skip = (button === "move" || action === "drag") && row === this.pointer.row && col === this.pointer.col;
    const gid = this.props.gid === 1 ? 0 : this.props.gid;

    button === "wheel" || e.stopPropagation();
    button === "wheel" || e.preventDefault();
    e.shiftKey && modiffier.push("S");
    e.ctrlKey && modiffier.push("C");
    e.altKey && modiffier.push("A");

    this.pointer = { row, col };
    skip || Emit.send("envim:mouse", gid, button, action, modiffier.join("-"), row, col);
    Emit.share("envim:focus");
  }

  private onMouseDown = (e: MouseEvent) => {
    clearTimeout(this.timer);

    this.timer = +setTimeout(() => {
      this.drag = true;
      Emit.share("envim:drag", this.props.id);
    });

    this.onMouseEvent(e, "press");
  }

  private onMouseMove = (e: MouseEvent) => {
    if (!(this.drag || this.props.mousemoveevent) || this.busy) return;

    this.onMouseEvent(e, "drag", this.drag ? "" : "move");
  }

  private onMouseUp = (e: MouseEvent) => {
    clearTimeout(this.timer);

    if (this.drag) {
      this.drag = false;
      Emit.share("envim:drag", "");
    }
    this.onMouseEvent(e, "release");
  }

  private onDragStart = (e: MouseEvent) => {
    this.dragging = { x: e.clientX, y: e.clientY };
  }

  private onDragEnd = (e: MouseEvent) => {
    const match = this.props.style.transform.match(/^translate\((\d+)px, (\d+)px\)$/);

    if (match) {
      const offset = { x: +match[1] + e.clientX - this.dragging.x, y: +match[2] + e.clientY - this.dragging.y };
      const resize = {
        width: this.props.style.width + Math.min(0, offset.x),
        height: this.props.style.height + Math.min(0, offset.y),
      };

      this.dragging = { x: 0, y: 0 };
      this.setState({ dragging: false });

      Emit.share("envim:drag", "");
      Emit.send("envim:position", this.props.gid, x2Col(Math.max(0, offset.x)), y2Row(Math.max(0, offset.y)));
      Emit.send("envim:resize", this.props.gid, Math.max(x2Col(resize.width), 18), y2Row(resize.height));
    }
  }

  private onWheel = (e: WheelEvent) => {
    this.delta.x = this.delta.x * e.deltaX >= 0 ? this.delta.x + e.deltaX : 0;
    this.delta.y = this.delta.y * e.deltaY >= 0 ? this.delta.y + e.deltaY : 0;

    const row = Math.abs(y2Row(this.delta.y));
    const col = Math.abs(x2Col(this.delta.x));

    for (let i = 0; i < row; i++) {
      this.delta = { x: 0, y: 0 };
      this.onMouseEvent(e, e.deltaY < 0 ? "up" : "down", "wheel");
    }
    for (let i = 0; i < col; i++) {
      this.delta = { x: 0, y: 0 };
      this.onMouseEvent(e, e.deltaX < 0 ? "left" : "right", "wheel");
    }
  }

  private onScroll = (e: MouseEvent) => {
    const per = e.nativeEvent.offsetY / e.currentTarget.clientHeight;
    const line = Math.ceil(this.state.scroll.total * per);

    this.runCommand(e, `${line} | redraw`);
  }

  private onClear = () => {
    Canvas.clear(this.props.id, x2Col(this.props.style.width), y2Row(this.props.style.height));
  }

  private onFlush = (flush: { cells: ICell[], scroll?: IScroll }[]) => {
    flush.forEach(({ cells, scroll }) => Canvas.push(this.props.id, cells, scroll));
  }

  private onPreview = (src: string) => {
    this.setState({ preview: { src, active: src.length > 0 ? (new Date).getTime() : 0 } });
  }

  private togglePreview = () => {
    const preview = this.state.preview;
    this.setState({ preview: { ...preview, active: preview.active ? 0 : (new Date).getTime() } });
  }

  private openExtWindow = (e: MouseEvent) => {
    const width = x2Col(this.props.style.width);
    const height = y2Row(this.props.style.height);

    this.runCommand(e, `call nvim_win_set_config(0, { "width": ${width}, "height": ${height}, "external": 1 })`)
  }

  private dragExtWIndow = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    this.setState({ dragging: true });
    Emit.share("envim:drag", this.props.id);
  }

  private onViewport = (top: number, bottom: number, total: number) => {
    const limit = this.props.style.height;
    const height = Math.min(Math.floor((bottom - top) / total * 100), 100);
    const scrolling = height === 100 ? this.state.scrolling : +setTimeout(() => {
      this.state.scrolling === scrolling && this.setState({ scrolling: 0 });
    }, 500);

    this.setState({ scrolling, scroll: {
      total,
      height: height ? `${height}%` : "4px",
      transform: `translateY(${Math.min(Math.floor(top / total * limit), limit - 4)}px)`,
    }});
  }

  private onDrag = (id: string) => {
    const nomouse = ["", this.props.id].indexOf(id) < 0;

    this.setState({ nomouse });
    id === "" && this.setState({ dragging: false });
    Cache.set<boolean>(TYPE, "nomouse", id.length > 0);
  }

  private onBusy = (busy: boolean) => {
    this.busy = busy;
    Cache.set<boolean>(TYPE, "busy", this.busy);
  }

  private changeMode = (mode: IMode) => {
    this.busy = mode.short_name === 'i';
    Cache.set<boolean>(TYPE, "busy", this.busy);
  }

  private onTabline = (_: ITab[], bufs: IBuffer[]) => {
    Cache.set<IBuffer[]>(TYPE, "bufs", bufs);
    this.setState({ bufs });
  }

  private renderMenu(label: string, command: string) {
    return (
      <MenuComponent color="gray-fg" label={label}>
        { this.state.bufs.map(({ name, buffer, active }, i) => (
          <FlexComponent active={active} title={name} onClick={e => this.runCommand(e, `${command}${buffer}`)} key={i} spacing>
            { name.replace(/.*\//, "…/") }
          </FlexComponent>
        )) }
      </MenuComponent>
    );
  }

  private renderIconMenu(label: string, menus: { font: string, onClick: (e: MouseEvent) => void }[][]) {
    return (
      <MenuComponent color="gray-fg" label={label} fit>
        { menus.map((menu, i) => (
          <FlexComponent key={i}>
            { menu.map((item, j) => <IconComponent key={`${i}-${j}`} color="gray-fg" { ...item } />) }
          </FlexComponent>
        )) }
      </MenuComponent>
    );
  }

  private renderPreview() {
    const { src, active } = this.state.preview;
    return <WebviewComponent src={src} active={active && this.props.focus ? (new Date).getTime() : active} style={active ? {} : { display: "none" }} />;
  }

  render() {
    const { height, scale } = Setting.font;

    return (
      <FlexComponent animate="fade-in hover" position="absolute" overflow="visible" nomouse={this.state.nomouse} style={this.props.style} shadow
        onMouseDown={this.state.dragging ? undefined : this.onMouseDown}
        onMouseMove={this.state.dragging ? undefined : this.onMouseMove}
        onMouseUp={this.state.dragging ? undefined : this.onMouseUp}
        onWheel={this.state.dragging ? undefined : this.onWheel}
        onDragStart={this.state.dragging ? this.onDragStart : undefined}
        onDragEnd={this.state.dragging ? this.onDragEnd : undefined}
      >
        <FlexComponent nomouse>
          <canvas width={this.props.style.width * scale} height={this.props.style.height * scale} ref={this.canvas} />
        </FlexComponent>
        { this.props.gid === 1 || this.renderPreview() }
        { this.props.gid === 1 || !this.props.focusable ? null : (
          <>
            <FlexComponent color="default" grow={1} position="absolute" inset={[0, -4, 0, "auto"]} onMouseDown={this.onScroll} hover={this.state.scrolling === 0}>
              <FlexComponent animate="fade-in" color="blue" border={[0, 2]} rounded={[2]} style={this.state.scroll} shadow nomouse></FlexComponent>
            </FlexComponent>
            <FlexComponent color="default" position="absolute" overflow="visible" inset={[-height, -4, "auto", "auto"]} rounded={[4, 4, 0, 0]} spacing hover
              onMouseDown={e => this.runCommand(e, "")}
            >
              <IconComponent color="gray-fg" font="" onClick={this.togglePreview} />
              { this.props.type === "normal" && (
                <>
                  { this.renderMenu("", "buffer ") }
                  { this.renderIconMenu("", [
                    [
                      { font: "", onClick: e => this.runCommand(e, "enew") },
                      { font: "", onClick: e => this.runCommand(e, "vsplit") },
                      { font: "", onClick: e => this.runCommand(e, "split") },
                    ],
                    [
                      { font: "󰶭", onClick: this.openExtWindow },
                      { font: "󱂪", onClick: e => this.runCommand(e, "wincmd H") },
                      { font: "󱂫", onClick: e => this.runCommand(e, "wincmd L") },
                    ],
                    [
                      { font: "󱔓", onClick: e => this.runCommand(e, "wincmd K") },
                      { font: "󱂩", onClick: e => this.runCommand(e, "wincmd J") },
                      { font: "󰉡", onClick: e => this.runCommand(e, "wincmd =") },
                    ],
                  ]) }
                  <IconComponent color="gray-fg" font="" onClick={e => this.runCommand(e, "write")} />
                </>
              )}
              { this.props.type === "external" && (
                <>
                  <IconComponent color="gray-fg" font="󰮐" active={this.state.dragging} onClick={this.dragExtWIndow} />
                  { this.renderIconMenu("", [
                    [
                      { font: "󱂪", onClick: e => this.runCommand(e, "wincmd H") },
                      { font: "󱂫", onClick: e => this.runCommand(e, "wincmd L") },
                    ],
                    [
                      { font: "󱔓", onClick: e => this.runCommand(e, "wincmd K") },
                      { font: "󱂩", onClick: e => this.runCommand(e, "wincmd J") },
                    ],
                  ]) }
                </>
              )}
              <IconComponent color="gray-fg" font="" onClick={e => this.runCommand(e, "confirm quit")} />
            </FlexComponent>
          </>
        )}
      </FlexComponent>
    );
  }
}
