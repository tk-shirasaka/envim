import React, { createRef, RefObject, MouseEvent, WheelEvent } from "react";

import { ICell, IScroll } from "common/interface";

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
const styles = {
  bg: {
    position,
    boxShadow: "0 0 8px 0 rgba(0, 0, 0, 0.6)",
  },
  fg: {
    position,
  },
};

export class EditorComponent extends React.Component<Props, States> {
  private fg: RefObject<HTMLCanvasElement> = createRef<HTMLCanvasElement>();
  private bg: RefObject<HTMLCanvasElement> = createRef<HTMLCanvasElement>();
  private timer: number = 0;
  private drag: boolean = false;
  private renderer?: Context2D;
  private capture?: { fg: ImageData; bg: ImageData };

  constructor(props: Props) {
    super(props);

    Emit.on(`clear:${this.props.grid}`, this.onClear.bind(this));
    Emit.on(`flush:${this.props.grid}`, this.onFlush.bind(this));
  }

  componentDidMount() {
    const fg = this.fg.current?.getContext("2d");
    const bg = this.bg.current?.getContext("2d");

    if (fg && bg) {
      this.renderer = new Context2D(fg, bg);
      this.renderer.clear(this.props.fill, 0, 0, x2Col(this.props.style.width), y2Row(this.props.style.height));
    }
  }

  componentDidUpdate() {
    if (this.renderer && this.capture) {
      this.renderer.clear(this.props.fill, 0, 0, x2Col(this.props.style.width), y2Row(this.props.style.height));
      this.renderer.putCapture(this.capture.fg, this.capture.bg, 0, 0);
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
      const [ fg, bg ] = this.renderer.getCapture(0, 0, x2Col(Math.min(prev.width, next.width)), y2Row(Math.min(prev.height, next.height)));
      this.capture = { fg, bg };
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
    this.renderer?.clear(this.props.fill, 0, 0, x2Col(this.props.style.width), y2Row(this.props.style.height));
  }

  private onFlush(cells: ICell[], scroll?: IScroll) {
    scroll && this.renderer?.push({ scroll });
    this.renderer?.push({ cells });
  }

  render() {
    return (
      <>
        <canvas className="animate fade-in" style={{...styles.bg, ...this.props.style}} width={this.props.style.width * 2} height={this.props.style.height * 2} ref={this.bg} />
        <canvas className="animate fade-in" style={{...styles.fg, ...this.props.style}} width={this.props.style.width * 2} height={this.props.style.height * 2} ref={this.fg}
          onMouseDown={this.onMouseDown.bind(this)}
          onMouseMove={this.onMouseMove.bind(this)}
          onMouseUp={this.onMouseRelease.bind(this)}
          onMouseLeave={this.onMouseRelease.bind(this)}
          onWheel={this.onMouseWheel.bind(this)}
        />
      </>
    );
  }
}
