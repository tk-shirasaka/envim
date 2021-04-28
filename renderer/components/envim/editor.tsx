import React, { createRef, RefObject, MouseEvent, WheelEvent } from "react";

import { ICell } from "common/interface";

import { Emit } from "../../utils/emit";
import { Context2D } from "../../utils/context2d";
import { y2Row, x2Col } from "../../utils/size";

interface Props {
  grid: number;
  fill: boolean;
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
}

const position: "absolute" = "absolute";
const style = {
  position,
  boxShadow: "0 0 8px 0 rgba(0, 0, 0, 0.6)",
  width: "100%",
  height: "100%",
};

export class EditorComponent extends React.Component<Props, States> {
  private canvas: RefObject<HTMLCanvasElement> = createRef<HTMLCanvasElement>();
  private timer: number = 0;
  private drag: boolean = false;
  private ctx?: CanvasRenderingContext2D;
  private renderer?: Context2D;
  private capture?: ImageData;

  constructor(props: Props) {
    super(props);

    Emit.on(`clear:${this.props.grid}`, this.onClear.bind(this));
    Emit.on(`flush:${this.props.grid}`, this.onFlush.bind(this));
  }

  componentDidMount() {
    const ctx = this.canvas.current?.getContext("2d");

    if (ctx) {
      this.ctx = ctx;
      this.renderer = new Context2D(ctx);
      this.renderer.clear(this.props.fill, this.props.style.width, this.props.style.height);
    }
  }

  componentDidUpdate() {
    if (this.ctx && this.capture) {
      this.renderer?.clear(this.props.fill, this.props.style.width, this.props.style.height);
      this.ctx.putImageData(this.capture, 0, 0);
      delete(this.capture);
    }
  }

  componentWillUnmount() {
    Emit.clear([`clear:${this.props.grid}`, `flush:${this.props.grid}`]);
  }

  shouldComponentUpdate(props: Props) {
    const prev = this.props.style;
    const next = props.style;
    if (this.ctx && (prev.width !== next.width || prev.height !== next.height)) {
      this.capture = this.ctx.getImageData(0, 0, Math.min(prev.width, next.width) * 2, Math.min(prev.height, next.height) * 2);
    }
    return true;
  }

  private onMouseEvent(e: MouseEvent, action: string, wheel: boolean = false) {
    const [col, row] = [ x2Col(e.nativeEvent.offsetX), y2Row(e.nativeEvent.offsetY) ];
    const button = wheel ? "wheel" : ["left", "middle", "right"][e.button] || "left";
    const modiffier = [];

    wheel || e.stopPropagation();
    wheel || e.preventDefault();

    e.shiftKey && modiffier.push("S");
    e.ctrlKey && modiffier.push("C");
    e.altKey && modiffier.push("A");

    Emit.send("envim:mouse", this.props.grid, button, action, modiffier.join("-"), row, col);
  }

  private onMouseDown(e: MouseEvent) {
    clearTimeout(this.timer);
    this.timer = +setTimeout(() => this.drag = true, 200);

    this.onMouseEvent(e, "press");
    Emit.share("envim:focus");
  }

  private onMouseMove(e: MouseEvent) {
    this.drag && this.onMouseEvent(e, "drag");
  }

  private onMouseUp(e: MouseEvent) {
    clearTimeout(this.timer);

    this.drag && this.onMouseEvent(e, "release");
    this.drag = false;
  }

  private onMouseWheel(e: WheelEvent) {
    if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) {
      this.onMouseEvent(e, e.deltaX < 0 ? "left" : "right", true);
    } else {
      this.onMouseEvent(e, e.deltaY < 0 ? "up" : "down", true);
    }
  }

  private onClear() {
    this.renderer?.clear(this.props.fill, this.props.style.width, this.props.style.height);
  }

  private onFlush(cells: ICell[]) {
    this.renderer?.flush(cells);
  }

  render() {
    return (
      <canvas className="animate fade-in" style={{...style, ...this.props.style}} width={this.props.style.width * 2} height={this.props.style.height * 2} ref={this.canvas}
        onMouseDown={this.onMouseDown.bind(this)}
        onMouseMove={this.onMouseMove.bind(this)}
        onMouseUp={this.onMouseUp.bind(this)}
        onWheel={this.onMouseWheel.bind(this)}
      />
    );
  }
}
