import React, { createRef, RefObject, MouseEvent, WheelEvent } from "react";

import { ICell, IScroll } from "common/interface";

import { Emit } from "../../utils/emit";
import { Setting } from "../../utils/setting";
import { Canvas } from "../../utils/canvas";
import { y2Row, x2Col } from "../../utils/size";

interface Props {
  grid: number;
  editor: { width: number; height: number; };
  style: {
    zIndex: number;
    width: number;
    height: number;
    transform: string;
    visibility: "visible" | "hidden";
    cursor: "default" | "not-allowed";
    pointerEvents: "none" | "auto";
  };
}

interface States {
}

const position: "absolute" = "absolute";
const styles = {
  scope: {
    position,
    overflow: "hidden",
    boxShadow: "0 0 8px 0 rgba(0, 0, 0, 0.6)",
  },
  canvas: {
    position,
    transformOrigin: "0 0",
  },
};

export class EditorComponent extends React.Component<Props, States> {
  private bg: RefObject<HTMLCanvasElement> = createRef<HTMLCanvasElement>();
  private fg: RefObject<HTMLCanvasElement> = createRef<HTMLCanvasElement>();
  private sp: RefObject<HTMLCanvasElement> = createRef<HTMLCanvasElement>();
  private clear: boolean = true;
  private timer: number = 0;
  private drag: boolean = false;
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
      Canvas.set(this.props.grid, bg, fg, sp);
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

  componentWillUnmount() {
    const grid = this.props.grid;
    Canvas.delete(grid);
    Emit.clear([`clear:${grid}`, `flush:${grid}`]);
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

  private onMouseEvent(e: MouseEvent, action: string, wheel: boolean = false) {
    const { scale } = Setting.font;
    const [col, row] = [ x2Col(e.nativeEvent.offsetX / scale), y2Row(e.nativeEvent.offsetY / scale) ];
    const button = wheel ? "wheel" : ["left", "middle", "right"][e.button] || "left";
    const modiffier = [];

    e.shiftKey && modiffier.push("S");
    e.ctrlKey && modiffier.push("C");
    e.altKey && modiffier.push("A");

    Emit.send("envim:mouse", this.props.grid, button, action, modiffier.join("-"), row, col);
  }

  private onMouseDown(e: MouseEvent) {
    clearTimeout(this.timer);
    this.timer = +setTimeout(() => {
      this.drag = true;
      Emit.share("envim:drag", this.props.grid)
    });

    this.onMouseEvent(e, "press");
  }

  private onMouseMove(e: MouseEvent) {
    if (this.drag === false) return;

    clearTimeout(this.timer);
    this.timer = +setTimeout(() => {
      this.onMouseEvent(e, "drag");
    });
  }

  private onMouseUp(e: MouseEvent) {
    clearTimeout(this.timer);

    if (this.drag) {
      this.drag = false;
      this.onMouseEvent(e, "release");
      Emit.share("envim:drag", -1);
    }
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

  private onFlush(flush: { cells: ICell[], scroll?: IScroll }[]) {
    this.clear && Canvas.clear(this.props.grid, x2Col(this.props.style.width), y2Row(this.props.style.height));
    flush.forEach(({ cells, scroll }) => Canvas.update(this.props.grid, cells, scroll))
    this.clear = false;
  }

  render() {
    const { scale } = Setting.font;

    return (
      <div className="animate fade-in" style={{...styles.scope, ...this.props.style}}
        onMouseDown={this.onMouseDown.bind(this)}
        onMouseMove={this.onMouseMove.bind(this)}
        onMouseUp={this.onMouseUp.bind(this)}
        onWheel={this.onMouseWheel.bind(this)}
      >
        <canvas style={{ ...styles.canvas, transform: `scale(${1 / scale})` }} width={this.props.editor.width * scale} height={this.props.editor.height * scale} ref={this.bg} />
        <canvas style={{ ...styles.canvas, transform: `scale(${1 / scale})` }} width={this.props.editor.width * scale} height={this.props.editor.height * scale} ref={this.fg} />
        <canvas style={{ ...styles.canvas, transform: `scale(${1 / scale})` }} width={this.props.editor.width * scale} height={this.props.editor.height * scale} ref={this.sp} />
      </div>
    );
  }
}
