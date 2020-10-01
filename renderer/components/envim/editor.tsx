import React, { MouseEvent, WheelEvent } from "react";

import { ICell } from "common/interface";

import { Emit } from "../../utils/emit";
import { Context2D } from "../../utils/context2d";
import { y2Row, x2Col } from "../../utils/size";

interface Props {
  grid: number;
  style: {
    zIndex: number;
    width: number;
    height: number;
    top: number;
    left: number;
    display?: "block" | "none";
    cursor?: "default" | "not-allowed";
  };
}

interface States {
}

const position: "absolute" = "absolute";
const style = {
  position,
  boxShadow: "0 8px 8px 0 rgba(0, 0, 0, 0.6)",
  width: "100%",
  height: "100%",
};

export class EditorComponent extends React.Component<Props, States> {
  private drag: boolean = false;
  private ctx?: CanvasRenderingContext2D;
  private renderer?: Context2D;
  private capture?: ImageData;

  constructor(props: Props) {
    super(props);

    Emit.on(`cursor:${this.props.grid}`, this.onCursor.bind(this));
    Emit.on(`clear:${this.props.grid}`, this.onClear.bind(this));
    Emit.on(`flush:${this.props.grid}`, this.onFlush.bind(this));
  }

  componentDidMount() {
    const canvas = this.refs.canvas as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      this.ctx = ctx;
      this.renderer = new Context2D(ctx);
      this.renderer.clear(this.props.style.width, this.props.style.height);
    }
  }

  componentDidUpdate() {
    if (this.ctx && this.capture) {
      this.renderer?.clear(this.props.style.width, this.props.style.height);
      this.ctx.putImageData(this.capture, 0, 0);
      delete(this.capture);
    }
  }

  componentWillUnmount() {
    Emit.clear([`cursor:${this.props.grid}`, `clear:${this.props.grid}`, `flush:${this.props.grid}`]);
  }

  shouldComponentUpdate(props: Props) {
    const prev = this.props.style;
    const next = props.style;
    if (this.ctx && (prev.width !== next.width || prev.height !== next.height)) {
      this.capture = this.ctx.getImageData(0, 0, Math.min(prev.width, next.width) * 2, Math.min(prev.height, next.height) * 2);
    }
    return true;
  }

  private onMouseEvent(e: MouseEvent, button: string, action: string) {
    const [col, row] = [ x2Col(e.nativeEvent.offsetX), y2Row(e.nativeEvent.offsetY) ];

    button === "left" && e.stopPropagation();
    button === "left" && e.preventDefault();
    Emit.send("envim:mouse", this.props.grid, button, action, row, col);
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

  private onCursor(cursor: { row: number, col: number, hl: number }) {
    this.renderer?.setCursor(cursor);
  }

  private onClear() {
    this.renderer?.clear(this.props.style.width, this.props.style.height);
  }

  private onFlush(cells: ICell[]) {
    this.renderer?.flush(cells);
  }

  render() {
    return (
      <canvas className="animate fade-in" style={{...style, ...this.props.style}} width={this.props.style.width * 2} height={this.props.style.height * 2} ref="canvas"
        onMouseDown={this.onMouseDown.bind(this)}
        onMouseMove={this.onMouseMove.bind(this)}
        onMouseUp={this.onMouseUp.bind(this)}
        onWheel={this.onMouseWheel.bind(this)}
      />
    );
  }
}
