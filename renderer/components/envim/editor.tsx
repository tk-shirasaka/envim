import React, { createRef, RefObject, MouseEvent, WheelEvent } from "react";

import { ICell, IScroll, ITab, IBuffer } from "common/interface";

import { Emit } from "../../utils/emit";
import { Setting } from "../../utils/setting";
import { Canvas } from "../../utils/canvas";
import { y2Row, x2Col, row2Y } from "../../utils/size";

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
  scroll: {
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

export class EditorComponent extends React.Component<Props, States> {
  private static bufs: IBuffer[] = [];

  private canvas: RefObject<HTMLCanvasElement> = createRef<HTMLCanvasElement>();
  private timer: number = 0;
  private drag: boolean = false;
  private pointer: { row: number; col: number } = { row: 0, col: 0 };
  private delta: { x: number; y: number } = { x: 0, y: 0 };
  private capture?: HTMLCanvasElement;

  constructor(props: Props) {
    super(props);

    this.state = { bufs: EditorComponent.bufs, nomouse: false, scrolling: 0, scroll: { height: "0", transform: "" } };
    Emit.on(`clear:${this.props.grid}`, this.onClear);
    Emit.on(`flush:${this.props.grid}`, this.onFlush);
    Emit.on(`viewport:${this.props.grid}`, this.onViewport);
    Emit.on("envim:drag", this.onDrag);
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
    Emit.off(`viewport:${this.props.grid}`, this.onViewport);
    Emit.off("envim:drag", this.onDrag);
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

  private onMouseEvent(e: MouseEvent, action: string, wheel: boolean = false) {
    const [col, row] = [ x2Col(e.nativeEvent.offsetX), y2Row(e.nativeEvent.offsetY) ];
    const button = wheel ? "wheel" : ["left", "middle", "right"][e.button] || "left";
    const modiffier = [];
    const skip = action === "drag" && row === this.pointer.row && col === this.pointer.col;

    e.shiftKey && modiffier.push("S");
    e.ctrlKey && modiffier.push("C");
    e.altKey && modiffier.push("A");

    this.pointer = { row, col };
    skip || Emit.send("envim:mouse", this.props.grid, button, action, modiffier.join("-"), row, col);
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

    const row = Math.abs(y2Row(this.delta.y));
    const col = Math.abs(x2Col(this.delta.x));

    for (let i = 0; i < row; i++) {
      this.delta = { x: 0, y: 0 };
      this.onMouseEvent(e, e.deltaY < 0 ? "up" : "down", true);
    }
    for (let i = 0; i < col; i++) {
      this.delta = { x: 0, y: 0 };
      this.onMouseEvent(e, e.deltaX < 0 ? "left" : "right", true);
    }
  }

  private onClear = () => {
    Canvas.clear(this.props.grid, x2Col(this.props.style.width), y2Row(this.props.style.height));
  }

  private onFlush = (flush: { cells: ICell[], scroll?: IScroll }[]) => {
    flush.forEach(({ cells, scroll }) => Canvas.update(this.props.grid, cells, scroll))
  }

  private onViewport = (top: number, bottom: number, total: number) => {
    if (total) {
      const height = Math.min(Math.floor((bottom - top) / total * 100), 100);
      const scrolling = height === 100 ? 0 : +setTimeout(() => {
        this.state.scrolling === scrolling && this.setState({ scrolling: 0 });
      }, 1000);

      this.setState({ scrolling, scroll: {
        height: height ? `${height}%` : "1px",
        transform: `translateY(${Math.floor(top / total * (this.props.style.height - row2Y(1)))}px)`,
      }});
    }
  }

  private onDrag = (grid: number) => {
    const nomouse = !(grid < 0 || grid === this.props.grid);

    this.setState({ nomouse });
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
      <FlexComponent animate="fade-in hover" position="absolute" overflow="visible" nomouse={this.state.nomouse} style={this.props.style} shadow
        onMouseDown={this.onMouseDown}
        onMouseMove={this.onMouseMove}
        onMouseUp={this.onMouseUp}
        onWheel={this.onWheel}
      >
        <FlexComponent grow={1} nomouse>
          <canvas style={{ ...styles.canvas, transform: `scale(${1 / scale})` }} width={this.props.editor.width * scale} height={this.props.editor.height * scale} ref={this.canvas} />
        </FlexComponent>
        { this.props.grid === 1 || !this.props.focusable ? null : (
          <FlexComponent color="black-fg" direction="column-reverse" vertical="end" position="absolute" overflow="visible" border={[1]} inset={[0]} hover={this.state.scrolling === 0}>
            <FlexComponent color="black" grow={1} shadow>
              <FlexComponent animate="fade-in" color="blue" padding={[0, 2]} rounded={[2]} style={this.state.scroll} shadow></FlexComponent>
            </FlexComponent>
            <FlexComponent color="black" overflow="visible" margin={[-1, -1, 0, 0]} padding={[0, 4]} rounded={[0, 0, 0, 4]} shadow
              onMouseDown={e => this.runCommand(e, "")}
            >
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
