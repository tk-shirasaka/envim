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

interface Props {
  grid: number;
  winid: number;
  focusable: boolean;
  lighten: boolean
  editor: { width: number; height: number; };
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
  scrolling: number;
  preview: { media: string; src: string; active: boolean; };
  scroll: {
    total: number;
    height: string;
    transform: string;
  };
}

const position: "absolute" = "absolute";
const styles = {
  icon: {
    paddingLeft: 4,
  },
  canvas: {
    position,
    transformOrigin: "0 0",
  },
};

const TYPE = "editor";

export class EditorComponent extends React.Component<Props, States> {
  private canvas: RefObject<HTMLCanvasElement> = createRef<HTMLCanvasElement>();
  private timer: number = 0;
  private drag: boolean = false;
  private busy: boolean = false;
  private pointer: { row: number; col: number } = { row: 0, col: 0 };
  private delta: { x: number; y: number } = { x: 0, y: 0 };
  private capture?: HTMLCanvasElement;

  constructor(props: Props) {
    super(props);

    this.busy = Cache.get<boolean>(TYPE, "busy");
    this.state = { bufs: Cache.get<IBuffer[]>(TYPE, "bufs") || [], nomouse: Cache.get<boolean>(TYPE, "nomouse"), scrolling: 0, preview: { media: "", src: "", active: false }, scroll: { total: 0, height: "100%", transform: "" } };
    Emit.on(`clear:${this.props.grid}`, this.onClear);
    Emit.on(`flush:${this.props.grid}`, this.onFlush);
    Emit.on(`preview:${this.props.grid}`, this.onPreview);
    Emit.on(`viewport:${this.props.grid}`, this.onViewport);
    Emit.on("envim:drag", this.onDrag);
    Emit.on("grid:busy", this.onBusy);
    Emit.on("mode:change", this.changeMode);
    Emit.on("tabline:update", this.onTabline);
  }

  componentDidMount() {
    const ctx = this.canvas.current?.getContext("2d");

    if (this.canvas.current && ctx) {
      Canvas.set(this.props.grid, this.canvas.current, ctx, this.props.lighten);
      Canvas.clear(this.props.grid, x2Col(this.props.style.width), y2Row(this.props.style.height));
      Emit.send("envim:ready", this.props.grid);
    }
  }

  componentDidUpdate() {
    if (this.capture) {
      Canvas.clear(this.props.grid, x2Col(this.props.style.width), y2Row(this.props.style.height));
      Canvas.putCapture(this.props.grid, this.capture);
      delete(this.capture);
    }
  }

  componentWillUnmount = () => {
    const grid = this.props.grid;

    clearInterval(this.timer);
    Canvas.delete(grid);
    Emit.off(`clear:${this.props.grid}`, this.onClear);
    Emit.off(`flush:${this.props.grid}`, this.onFlush);
    Emit.off(`preview:${this.props.grid}`, this.onPreview);
    Emit.off(`viewport:${this.props.grid}`, this.onViewport);
    Emit.off("envim:drag", this.onDrag);
    Emit.off("grid:busy", this.onBusy);
    Emit.off("mode:change", this.changeMode);
    Emit.off("tabline:update", this.onTabline);
  }

  shouldComponentUpdate(props: Props) {
    const prev = this.props;
    const next = props;
    if (prev.style.width < next.style.width || prev.style.height < next.style.height || prev.editor.width !== next.editor.width || prev.editor.height !== next.editor.height) {
      this.capture = Canvas.getCapture(this.props.grid);
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

    const [col, row] = [ x2Col(e.nativeEvent.offsetX), y2Row(e.nativeEvent.offsetY - Setting.font.lspace) ];
    const modiffier = [];
    const skip = (button === "move" || action === "drag") && row === this.pointer.row && col === this.pointer.col;
    const grid = this.props.grid === 1 ? 0 : this.props.grid;

    button === "wheel" || e.stopPropagation();
    button === "wheel" || e.preventDefault();
    e.shiftKey && modiffier.push("S");
    e.ctrlKey && modiffier.push("C");
    e.altKey && modiffier.push("A");

    this.pointer = { row, col };
    skip || Emit.send("envim:mouse", grid, button, action, modiffier.join("-"), row, col);
    Emit.share("envim:focus");
  }

  private onMouseDown = (e: MouseEvent) => {
    clearTimeout(this.timer);

    this.timer = +setTimeout(() => {
      this.drag = true;
      Emit.share("envim:drag", this.props.grid);
    });

    this.onMouseEvent(e, "press");
  }

  private onMouseMove = (e: MouseEvent) => {
    if (!this.drag && this.busy) return;

    this.onMouseEvent(e, "drag", this.drag ? "" : "move");
  }

  private onMouseUp = (e: MouseEvent) => {
    clearTimeout(this.timer);

    if (this.drag) {
      this.drag = false;
      Emit.share("envim:drag", -1);
    }
    this.onMouseEvent(e, "release");
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
    Canvas.clear(this.props.grid, x2Col(this.props.style.width), y2Row(this.props.style.height));
  }

  private onFlush = (flush: { cells: ICell[], scroll?: IScroll }[]) => {
    flush.forEach(({ cells, scroll }) => Canvas.update(this.props.grid, cells, scroll));
  }

  private onPreview = (media: string, src: string) => {
    this.setState({ preview: { media, src, active: src.length > 0 } });
  }

  private togglePreview = () => {
    const preview = this.state.preview;
    this.setState({ preview: { ...preview, active: !preview.active } });
  }

  private onViewport = (top: number, bottom: number, total: number) => {
    const limit = this.props.style.height;
    const height = Math.min(Math.floor((bottom - top) / total * 100), 100);
    const scrolling = height === 100 ? this.state.scrolling: +setTimeout(() => {
      this.state.scrolling === scrolling && this.setState({ scrolling: 0 });
    }, 500);

    this.setState({ scrolling, scroll: {
      total,
      height: height ? `${height}%` : "4px",
      transform: `translateY(${Math.min(Math.floor(top / total * limit), limit - 4)}px)`,
    }});
  }

  private onDrag = (grid: number) => {
    const nomouse = [-1, this.props.grid].indexOf(grid) < 0;

    this.setState({ nomouse });
    Cache.set<boolean>(TYPE, "nomouse", grid >= 0);
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

  private renderMenu(label: string, command: { main: string; sub: string; }) {
    return (
      <MenuComponent color="gray-fg" style={styles.icon} onClick={e => this.runCommand(e, command.main)} label={label}>
        { this.state.bufs.map(({ name, buffer, active }, i) => (
          <FlexComponent color="default" active={active} title={name} padding={[0, 4]} onClick={e => this.runCommand(e, `${command.sub}${buffer}`)} key={i}>
            { name.replace(/.*\//, "…/") }
          </FlexComponent>
        )) }
      </MenuComponent>
    );
  }

  private renderPreview() {
    switch (this.state.preview.active && this.state.preview.media) {
      case "image": return <img src={this.state.preview.src} onMouseDown={e => this.runCommand(e, "")}/>;
      case "video": return <video src={this.state.preview.src} onMouseDown={e => this.runCommand(e, "")} controls />;
      case "application": return <object data={this.state.preview.src} onMouseDown={e => this.runCommand(e, "")} />;
      default: return null;
    }
  }

  render() {
    const { scale } = Setting.font;

    return (
      <FlexComponent animate="fade-in hover" position="absolute" overflow="visible" nomouse={this.state.nomouse} style={this.props.style} shadow
        onMouseDown={this.onMouseDown}
        onMouseMove={this.onMouseMove}
        onMouseUp={this.onMouseUp}
        onWheel={this.onWheel}
      >
        <FlexComponent grow={1} nomouse>
          <canvas style={{ ...styles.canvas, transform: `scale(${1 / scale})` }} width={this.props.editor.width * scale} height={this.props.editor.height * scale} ref={this.canvas} />
        </FlexComponent>
        { this.props.grid === 1 || this.renderPreview() }
        { this.props.grid === 1 || !this.props.focusable ? null : (
          <>
            { this.state.scroll.height === "100%" && this.state.scrolling === 0 ? null : (
              <FlexComponent color="default" grow={1} position="absolute" inset={[0, 0, 0, "auto"]} onMouseDown={this.onScroll} hover={this.state.scrolling === 0}>
                <FlexComponent animate="fade-in" color="blue" border={[0, 2]} rounded={[2]} style={this.state.scroll} shadow nomouse></FlexComponent>
              </FlexComponent>
            )}
            <FlexComponent color="default" position="absolute" overflow="visible" inset={["auto", 0, "auto", "auto"]} margin={[-1, -1, 0, 0]} padding={[0, 4]} rounded={[0, 0, 0, 4]} hover shadow
              onMouseDown={e => this.runCommand(e, "")}
            >
              { this.state.preview.src && <IconComponent color="gray-fg" font="" onClick={this.togglePreview} /> }
              { this.renderMenu("", { main: "edit", sub: "buffer "}) }
              { this.renderMenu("", { main: "vnew", sub: "vsplit #"}) }
              { this.renderMenu("", { main: "new", sub: "split #"}) }
              <IconComponent color="gray-fg" font="" onClick={e => this.runCommand(e, "write")} />
              { this.renderMenu("", { main: "confirm quit", sub: "confirm bdelete "}) }
            </FlexComponent>
          </>
        )}
      </FlexComponent>
    );
  }
}
