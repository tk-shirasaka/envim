import React, { createRef, RefObject, MouseEvent, WheelEvent } from "react";

import { ICell, IScroll } from "common/interface";

import { Emit } from "../../utils/emit";
import { Context2D } from "../../utils/context2d";
import { y2Row, x2Col } from "../../utils/size";

interface Props {
  grid: number;
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
const styles = {
  scope: {
    position,
    boxShadow: "0 0 8px 0 rgba(0, 0, 0, 0.6)",
  },
  canvas: {
    position,
    width: "100%",
    height: "100%",
  },
};

export class EditorComponent extends React.Component<Props, States> {
  private bg: RefObject<HTMLCanvasElement> = createRef<HTMLCanvasElement>();
  private fg: RefObject<HTMLCanvasElement> = createRef<HTMLCanvasElement>();
  private sp: RefObject<HTMLCanvasElement> = createRef<HTMLCanvasElement>();
  private clear: boolean = true;
  private timer: number = 0;
  private drag: boolean = false;
  private renderer?: Context2D;
  private capture?: { bg: ImageData; fg: ImageData; sp: ImageData };

  constructor(props: Props) {
    super(props);

    Emit.on(`clear:${this.props.grid}`, this.onClear.bind(this));
    Emit.on(`flush:${this.props.grid}`, this.onFlush.bind(this));
  }

  componentDidMount() {
    const bg = this.bg.current?.getContext("2d");
    const fg = this.fg.current?.getContext("2d");
    const sp = this.sp.current?.getContext("2d");

    if (bg && fg && sp) {
      this.renderer = new Context2D(bg, fg, sp);
      this.renderer.clear(0, 0, x2Col(this.props.style.width), y2Row(this.props.style.height));
    }
  }

  componentDidUpdate() {
    if (this.renderer && this.capture) {
      this.renderer.clear(0, 0, x2Col(this.props.style.width), y2Row(this.props.style.height));
      this.renderer.putCapture(this.capture.bg, this.capture.fg, this.capture.sp, 0, 0);
      delete(this.capture);
    }
  }

  componentWillUnmount() {
    delete(this.renderer);
    Emit.clear([`clear:${this.props.grid}`, `flush:${this.props.grid}`]);
  }

  shouldComponentUpdate(props: Props) {
    const prev = this.props.style;
    const next = props.style;
    if (this.renderer && (prev.width !== next.width || prev.height !== next.height)) {
      const [ bg, fg, sp ] = this.renderer.getCapture(0, 0, x2Col(Math.min(prev.width, next.width)), y2Row(Math.min(prev.height, next.height)));
      this.capture = { bg, fg, sp };
    }
    return true;
  }

  private onMouseEvent(e: MouseEvent, action: string, wheel: boolean = false) {
    const [col, row] = [ x2Col(e.nativeEvent.offsetX), y2Row(e.nativeEvent.offsetY) ];
    const button = wheel ? "wheel" : ["left", "middle", "right"][e.button] || "left";
    const modiffier = [];

    e.shiftKey && modiffier.push("S");
    e.ctrlKey && modiffier.push("C");
    e.altKey && modiffier.push("A");

    Emit.send("envim:mouse", this.props.grid, button, action, modiffier.join("-"), row, col);
  }

  private onMouseDown(e: MouseEvent) {
    clearTimeout(this.timer);
    this.timer = +setTimeout(() => this.drag = true, 200);

    this.onMouseEvent(e, "press");
  }

  private onMouseMove(e: MouseEvent) {
    this.drag && this.onMouseEvent(e, "drag");
  }

  private onMouseRelease(e: MouseEvent) {
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
    this.clear = true;
  }

  private onFlush(cells: ICell[], scroll?: IScroll) {
    this.clear && this.renderer?.clear(0, 0, x2Col(this.props.style.width), y2Row(this.props.style.height));
    scroll && this.renderer?.push({ scroll });
    this.renderer?.push({ cells });
    this.clear = false;
  }

  render() {
    return (
      <div className="animate fade-in" style={{...styles.scope, ...this.props.style}}
        onMouseDown={this.onMouseDown.bind(this)}
        onMouseMove={this.onMouseMove.bind(this)}
        onMouseUp={this.onMouseRelease.bind(this)}
        onMouseLeave={this.onMouseRelease.bind(this)}
        onWheel={this.onMouseWheel.bind(this)}
      >
        <canvas style={styles.canvas} width={this.props.style.width * 2} height={this.props.style.height * 2} ref={this.bg} />
        <canvas style={styles.canvas} width={this.props.style.width * 2} height={this.props.style.height * 2} ref={this.fg} />
        <canvas style={styles.canvas} width={this.props.style.width * 2} height={this.props.style.height * 2} ref={this.sp} />
      </div>
    );
  }
}
