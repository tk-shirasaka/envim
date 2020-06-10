import React, { MouseEvent, WheelEvent } from "react";

import { ICell } from "common/interface";

import { Emit } from "../../utils/emit";
import { Context2D } from "../../utils/context2d";
import { y2Row, x2Col } from "../../utils/size";

interface Props {
  grid: number;
  mouse: boolean;
  style: {
    width: number;
    height: number;
    top: number;
    left: number;
    display?: "block" | "none";
    cursor?: "text" | "not-allowed";
  };
}

interface States {
  init: boolean;
}

const position: "absolute" = "absolute";
const styles = {
  scope: {
    position,
    cursor: "text",
    animation: "fadeIn .5s ease",
    boxShadow: "0 8px 8px 0 rgba(0, 0, 0, 0.6)",
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  canvas: {
    width: "100%",
    height: "100%",
  },
};

export class EditorComponent extends React.Component<Props, States> {
  private drag: boolean = false;
  private renderer?: Context2D;

  constructor(props: Props) {
    super(props);
    this.state = { init: false };

    Emit.on(`cursor:${this.props.grid}`, this.onCursor.bind(this));
    Emit.on(`flush:${this.props.grid}`, this.onFlush.bind(this));
    this.props.grid === 1 && Emit.send("envim:resize", this.props.grid, x2Col(this.props.style.width), y2Row(this.props.style.height));
  }

  componentDidMount() {
    const canvas = this.refs.canvas as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      this.renderer = new Context2D(ctx);
    }
  }

  componentDidUpdate() {
    this.props.grid === 1 && Emit.send("envim:resize", this.props.grid, x2Col(this.props.style.width), y2Row(this.props.style.height));
  }

  componentWillUnmount() {
    Emit.clear([`cursor:${this.props.grid}`, `flush:${this.props.grid}`]);
  }

  private onMouseEvent(e: MouseEvent, button: string, action: string) {
    const [col, row] = [ x2Col(e.nativeEvent.offsetX), y2Row(e.nativeEvent.offsetY) ];

    button === "left" && e.stopPropagation();
    button === "left" && e.preventDefault();
    this.props.mouse && Emit.send("envim:mouse", this.props.grid, button, action, row, col);
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

  private onFlush(cells: ICell[]) {
    this.state.init || this.setState({ init: true });
    this.renderer?.flush(cells);
  }

  render() {
    return (
      <div style={{ ...styles.scope, ...this.props.style }}>
        { this.state.init || <div className="color-black" style={styles.loading}><span>Loading...</span></div> }
        <canvas style={styles.canvas} width={this.props.style.width * 2} height={this.props.style.height * 2} ref="canvas"
          onMouseDown={this.onMouseDown.bind(this)}
          onMouseMove={this.onMouseMove.bind(this)}
          onMouseUp={this.onMouseUp.bind(this)}
          onWheel={this.onMouseWheel.bind(this)}
        />
      </div>
    );
  }
}
