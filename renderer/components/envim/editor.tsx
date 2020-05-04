import React, { MouseEvent, WheelEvent } from "react";

import { ICell } from "common/interface";

import { Emit } from "../../utils/emit";
import { Context2D } from "../../utils/context2d";
import { font } from "../../utils/font";

interface Props {
  width: number;
  height: number;
}

interface States {
}

const position: "absolute" = "absolute";
const style = {
  position,
  cursor: "text",
  display: "block",
};

export class EditorComponent extends React.Component<Props, States> {
  private drag: boolean = false;
  private mouse: boolean = false;
  private renderer?: Context2D;
  private offset?: { x: number, y: number };

  constructor(props: Props) {
    super(props);

    Emit.on("envim:ime", this.onIme.bind(this));
    Emit.on("grid:cursor", this.onCursor.bind(this));
    Emit.on("envim:mouse", this.onMouse.bind(this));
    Emit.on("envim:flush", this.onFlush.bind(this));
    Emit.send("envim:resize", ...this.getNvimSize(this.props.width, this.props.height));
  }

  componentDidMount() {
    const canvas = this.refs.canvas as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const { x, y } = canvas.getBoundingClientRect();
      this.renderer = new Context2D(ctx);
      this.offset = { x, y };
    }
  }

  componentDidUpdate() {
    this.renderer?.setFont();
    Emit.send("envim:resize", ...this.getNvimSize(this.props.width, this.props.height));
  }

  componentWillUnmount() {
    Emit.clear(["envim:ime", "grid:cursor", "envim:mouse", "envim:flush"]);
  }

  private getNvimSize(x: number, y: number) {
    const { width, height } = font.get();
    return [Math.floor(x / width), Math.floor(y / height)];
  }

  private onMouseEvent(e: MouseEvent, button: string, action: string) {

    const { x, y } = this.offset || { x: 0, y: 0 };
    const [col, row] = this.getNvimSize(e.clientX - x, e.clientY - y);

    button === "left" && e.stopPropagation();
    button === "left" && e.preventDefault();
    this.mouse && Emit.send("envim:mouse", button, action, row, col);
  }

  private onMouseDown(e: MouseEvent) {
    switch (e.button) {
      case 0:
        this.drag = true;
        this.onMouseEvent(e, "left", "press");
        Emit.share("envim:focus");
      break;
    }
  }

  private onMouseMove(e: MouseEvent) {
    this.drag && this.onMouseEvent(e, "left", "drag");
  }

  private onMouseUp(e: MouseEvent) {
    this.drag = false;
    this.onMouseEvent(e, "left", "release");
  }

  private onMouseWheel(e: WheelEvent) {
    this.onMouseEvent(e, "wheel", e.deltaY < 0 ? "up" : "down");
  }

  private onIme(text: string) {
    this.renderer?.text(text);
  }

  private onCursor(cursor: { row: number, col: number, hl: number }) {
    this.renderer?.setCursor(cursor);
  }

  private onMouse(mouse: boolean) {
    this.mouse = mouse;
  }

  private onFlush(cells: ICell[]) {
    this.renderer?.flush(cells);
  }

  render() {
    return (
      <canvas style={{...this.props, ...style}} width={this.props.width * 2} height={this.props.height * 2} ref="canvas"
        onMouseDown={this.onMouseDown.bind(this)}
        onMouseMove={this.onMouseMove.bind(this)}
        onMouseUp={this.onMouseUp.bind(this)}
        onWheel={this.onMouseWheel.bind(this)}
        />
    );
  }
}
