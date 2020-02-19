import React from "react";

import { ICell } from "common/interface";
import { Emit } from "../../utils/emit";
import { Highlights } from "../../utils/highlight";
import { Context2D } from "../../utils/context2d";

interface Props {
  width: number;
  height: number;
}

interface States {
  visible: boolean;
}

const position: "absolute" = "absolute";
const pointerEvents: "none" = "none";
const style = {
  position,
  display: "block",
  left: 0,
  right: 0,
  bottom: 0,
  animation: "fadeIn .5s ease",
  borderRadius: "4px 4px 0 0",
  boxShadow: "0 0 10px 5px #000",
  pointerEvents,
};

export class CmdlineComponent extends React.Component<Props, States> {
  private renderer?: Context2D;

  constructor(props: Props) {
    super(props);

    this.state = { visible: false };
    Emit.on("cmdline:show", this.onCmdline.bind(this));
    Emit.on("cmdline:cursor", this.onCursor.bind(this));
    Emit.on("cmdline:flush", this.onFlush.bind(this));
    Emit.on("cmdline:hide", this.offCmdline.bind(this));
  }

  componentDidUpdate() {
    const ctx = (this.refs.canvas as HTMLCanvasElement)?.getContext("2d");

    if (ctx) {
      this.renderer = new Context2D(ctx);
    }
  }

  componentWillUnmount() {
    Emit.clear(["cmdline:show", "cmdline:cursor", "cmdline:flush", "cmdline:hide"]);
  }

  private onCmdline() {
    this.state.visible || this.setState({ visible: true });
  }

  private onCursor(cursor: { row: number, col: number, hl: number }) {
    this.renderer?.setCursor(cursor);
  }

  private onFlush(cells: ICell[]) {
    this.renderer?.flush(cells);
  }

  private offCmdline() {
    delete(this.renderer);
    this.state.visible && this.setState({ visible: false });
  }

  private getStyle() {
    return {
      ...style,
      ...this.props,
      background: Highlights.color(0, "background"),
    };
  }

  render() {
    return this.state.visible === false ? null : (
      <canvas style={this.getStyle()} width={this.props.width * 2} height={this.props.height * 2} ref="canvas"></canvas>
    );
  }
}
