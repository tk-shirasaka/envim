import React, { createRef, RefObject, MouseEvent, WheelEvent } from "react";

import { ICell, IScroll, ITab, IBuffer } from "common/interface";

import { Emit } from "../../utils/emit";
import { Setting } from "../../utils/setting";
import { Canvas } from "../../utils/canvas";
import { y2Row, x2Col } from "../../utils/size";

import { FlexComponent } from "../flex";
import { IconComponent } from "../icon";
import { MenuComponent } from "../menu";

interface Props {
  grid: number;
  winid: number;
  transparent: boolean
  editor: { width: number; height: number; };
  style: {
    zIndex: number;
    width: number;
    height: number;
    transform: string;
    visibility: "visible" | "hidden";
    cursor: "default" | "not-allowed";
  };
}

interface States {
  bufs: IBuffer[];
  editor: {
    pointerEvents: "none" | "auto";
  };
  scroll: {
    height: string;
    top: string;
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

export class EditorComponent extends React.Component<Props, States> {
  private static bufs: IBuffer[] = [];

  private bg: RefObject<HTMLCanvasElement> = createRef<HTMLCanvasElement>();
  private fg: RefObject<HTMLCanvasElement> = createRef<HTMLCanvasElement>();
  private sp: RefObject<HTMLCanvasElement> = createRef<HTMLCanvasElement>();
  private clear: boolean = true;
  private timer: number = 0;
  private drag: boolean = false;
  private delta: { x: number; y: number } = { x: 0, y: 0 };
  private capture?: { bg: ImageData; fg: ImageData; sp: ImageData };

  constructor(props: Props) {
    super(props);

    this.state = { bufs: EditorComponent.bufs, editor: { pointerEvents: "auto" }, scroll: { height: "0", top: "" } };
    Emit.on(`clear:${this.props.grid}`, this.onClear);
    Emit.on(`flush:${this.props.grid}`, this.onFlush);
    Emit.on(`viewport:${this.props.grid}`, this.onViewport);
    Emit.on("envim:drag", this.onDrag);
    Emit.on("tabline:update", this.onTabline);
  }

  componentDidMount() {
    const bg = this.bg.current?.getContext("2d");
    const fg = this.fg.current?.getContext("2d");
    const sp = this.sp.current?.getContext("2d");

    if (bg && fg && sp) {
      Canvas.set(this.props.grid, bg, fg, sp, this.props.transparent);
      Canvas.clear(this.props.grid, x2Col(this.props.style.width), y2Row(this.props.style.height));
    }
  }

  componentDidUpdate() {
    if (this.capture) {
      Canvas.clear(this.props.grid, x2Col(this.props.style.width), y2Row(this.props.style.height));
      Canvas.putCapture(this.props.grid, this.capture.bg, this.capture.fg, this.capture.sp);
      delete(this.capture);
    }
  }

  componentWillUnmount = () => {
    const grid = this.props.grid;
    clearInterval(this.timer);
    Canvas.delete(grid);
    Emit.off(`clear:${this.props.grid}`, this.onClear);
    Emit.off(`flush:${this.props.grid}`, this.onFlush);
    Emit.off(`viewport:${this.props.grid}`, this.onViewport);
    Emit.off("envim:drag", this.onDrag);
    Emit.off("tabline:update", this.onTabline);
  }

  shouldComponentUpdate(props: Props) {
    const prev = this.props;
    const next = props;
    if (prev.style.width < next.style.width || prev.style.height < next.style.height || prev.editor.width !== next.editor.width || prev.editor.height !== next.editor.height) {
      const [ bg, fg, sp ] = Canvas.getCapture(this.props.grid, x2Col(Math.min(prev.style.width, next.style.width)), y2Row(Math.min(prev.style.height, next.style.height)));
      this.capture = { bg, fg, sp };
    }
    return true;
  }

  private runCommand(e: MouseEvent, command: string) {
    e.stopPropagation();
    e.preventDefault();

    command && Emit.send("envim:api", "nvim_call_function", ["win_execute", [this.props.winid, command]]);
  }

  private onMouseEvent(e: MouseEvent, action: string, wheel: boolean = false) {
    const target = e.target as HTMLDivElement;
    const origin = target.offsetWidth;
    const actual = target.getBoundingClientRect().width;
    const scale = Math.floor(origin / actual);
    const [col, row] = [ x2Col(e.nativeEvent.offsetX / scale), y2Row(e.nativeEvent.offsetY / scale) ];
    const button = wheel ? "wheel" : ["left", "middle", "right"][e.button] || "left";
    const modiffier = [];

    e.shiftKey && modiffier.push("S");
    e.ctrlKey && modiffier.push("C");
    e.altKey && modiffier.push("A");

    Emit.send("envim:mouse", this.props.grid, button, action, modiffier.join("-"), row, col);
  }

  private onMouseDown = (e: MouseEvent) => {
    clearTimeout(this.timer);
    this.timer = +setTimeout(() => {
      this.drag = true;
      Emit.share("envim:drag", this.props.grid)
    }, 200);

    this.onMouseEvent(e, "press");
  }

  private onMouseMove = (e: MouseEvent) => {
    if (this.drag === false) return;

    clearTimeout(this.timer);
    this.timer = +setTimeout(() => {
      this.onMouseEvent(e, "drag");
    });
  }

  private onMouseUp = (e: MouseEvent) => {
    clearTimeout(this.timer);

    if (this.drag) {
      this.drag = false;
      this.onMouseEvent(e, "release");
      Emit.share("envim:drag", -1);
    }
  }

  private onWheel = (e: WheelEvent) => {
    this.delta.x = this.delta.x * e.deltaX >= 0 ? this.delta.x + e.deltaX : 0;
    this.delta.y = this.delta.y * e.deltaY >= 0 ? this.delta.y + e.deltaY : 0;

    const row = y2Row(this.delta.y);
    const col = x2Col(this.delta.x);

    if (row) {
      this.delta.y = 0;
      this.onMouseEvent(e, e.deltaY < 0 ? "up" : "down", true);
    }
    if (col) {
      this.delta.x = 0;
      this.onMouseEvent(e, e.deltaX < 0 ? "left" : "right", true);
    }
  }

  private onClear = () => {
    this.clear = true;
  }

  private onFlush = (flush: { cells: ICell[], scroll?: IScroll }[]) => {
    this.clear && Canvas.clear(this.props.grid, x2Col(this.props.style.width), y2Row(this.props.style.height));
    flush.forEach(({ cells, scroll }) => Canvas.update(this.props.grid, cells, scroll))
    this.clear = false;
  }

  private onViewport = (top: number, bottom: number, total: number) => {
    if (total) {
      const height = Math.min(Math.floor((bottom - top) / total * 100), 100);

      this.setState({ scroll: {
        height: height ? `${height}%` : "1px",
        top: `${Math.floor(top / total * 100)}%`,
      }});
    }
  }

  private onDrag = (grid: number) => {
    const pointerEvents = grid < 0 || grid === this.props.grid ? "auto" : "none";

    this.setState({ editor: { pointerEvents } });
  }

  private onTabline = (_: ITab[], bufs: IBuffer[]) => {
    EditorComponent.bufs = bufs;
    this.setState({ bufs });
  }

  private renderMenu(label: string, command: { main: string; sub: string; }) {
    return (
      <MenuComponent color="gray-fg" style={styles.icon} onClick={e => this.runCommand(e, command.main)} label={label}>
        { this.state.bufs.map(({ name, buffer, active }, i) => (
          <FlexComponent color="black" active={active} title={name} padding={[0, 4]} onClick={e => this.runCommand(e, `${command.sub}${buffer}`)} key={i}>
            { name.replace(/.*\//, "…/") }
          </FlexComponent>
        )) }
      </MenuComponent>
    );
  }

  render() {
    const { scale } = Setting.font;

    return (
      <FlexComponent animate="fade-in hover" position="absolute" overflow="visible" style={{ ...this.props.style, ...this.state.editor }} shadow
        onMouseDown={this.onMouseDown}
        onMouseMove={this.onMouseMove}
        onMouseUp={this.onMouseUp}
        onWheel={this.onWheel}
      >
        <FlexComponent grow={1}>
          <canvas style={{ ...styles.canvas, transform: `scale(${1 / scale})` }} width={this.props.editor.width * scale} height={this.props.editor.height * scale} ref={this.bg} />
          <canvas style={{ ...styles.canvas, transform: `scale(${1 / scale})` }} width={this.props.editor.width * scale} height={this.props.editor.height * scale} ref={this.fg} />
          <canvas style={{ ...styles.canvas, transform: `scale(${1 / scale})` }} width={this.props.editor.width * scale} height={this.props.editor.height * scale} ref={this.sp} />
        </FlexComponent>
        { this.props.grid === 1 || this.props.style.cursor === "not-allowed" ? null : (
          <FlexComponent color="black-fg" direction="column-reverse" vertical="end" position="absolute" overflow="visible" border={[1]} inset={[0]} hover>
            <FlexComponent color="black" grow={1} shadow>
              <FlexComponent animate="fade-in" color="blue" padding={[0, 2]} rounded={[2]} style={this.state.scroll} shadow></FlexComponent>
            </FlexComponent>
            <FlexComponent color="black" overflow="visible" margin={[-1, -1, 0, 0]} padding={[0, 4]} rounded={[0, 0, 0, 4]} shadow>
              { this.renderMenu("", { main: "edit", sub: "buffer "}) }
              { this.renderMenu("", { main: "vnew", sub: "vsplit #"}) }
              { this.renderMenu("", { main: "new", sub: "split #"}) }
              <IconComponent color="gray-fg" font="" onClick={e => this.runCommand(e, "write")} />
              { this.renderMenu("", { main: "confirm quit", sub: "confirm bdelete "}) }
            </FlexComponent>
          </FlexComponent>
        )}
      </FlexComponent>
    );
  }
}
