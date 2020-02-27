import React from "react";

import { ICell } from "common/interface";
import { Emit } from "../../utils/emit";
import { Context2D } from "../../utils/context2d";

import { IconComponent } from "../icon";

interface Props {
  width: number;
  height: number;
}

interface States {
  visible: boolean;
  hide: boolean;
}

const positionA: "absolute" = "absolute";
const positionF: "fixed" = "fixed";
const pointerEvents: "none" = "none";
const styles = {
  canvas: {
    position: positionA,
    display: "block",
    left: 0,
    right: 0,
    bottom: 0,
    animation: "fadeIn .5s ease",
    borderRadius: "4px 4px 0 0",
    boxShadow: "0 0 10px 5px #000",
    pointerEvents,
  },
  hide: {
    display: "none",
  },
  icon: {
    animation: "fadeIn .5s ease",
    position: positionF,
    right: 8,
    bottom: 0,
  },
};

export class CmdlineComponent extends React.Component<Props, States> {
  private renderer?: Context2D;

  constructor(props: Props) {
    super(props);

    this.state = { visible: false, hide: false };
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
    this.state.visible || this.setState({ visible: true, hide: false });
  }

  private onCursor(cursor: { row: number, col: number, hl: number }) {
    this.renderer?.setCursor(cursor);
  }

  private onFlush(cells: ICell[]) {
    this.renderer?.flush(cells);
  }

  private offCmdline() {
    delete(this.renderer);
    this.state.visible && this.setState({ visible: false, hide: false });
  }

  private toggleCmdline() {
    Emit.share("envim:focus");
    this.setState({ hide: !this.state.hide });
  }

  private getStyle() {
    const style = { ...styles.canvas, ...this.props };

    return this.state.hide ? { ...styles.hide, style } : style;
  }

  render() {
    return this.state.visible === false ? null : (
      <>
        <canvas style={this.getStyle()} width={this.props.width * 2} height={this.props.height * 2} ref="canvas"></canvas>
        <IconComponent color="green-fg" style={styles.icon} font={this.state.hide ? "" : ""} onClick={this.toggleCmdline.bind(this)} />
      </>
    );
  }
}
