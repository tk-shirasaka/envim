import React from "react";
import { ipcRenderer, IpcRendererEvent } from "electron";

import { ICell } from "common/interface";
import { Highlights } from "../../utils/highlight";
import { Context2D } from "../../utils/context2d";

interface Props {
  font: { size: number; width: number; height: number; };
  win: { width: number; height: number; };
}

interface States {
  visible: boolean;
}

const position: "absolute" = "absolute";
const pointerEvents: "none" = "none";
const style = {
  position,
  display: "block",
  top: "30%",
  left: "10%",
  right: "10%",
  padding: 4,
  animation: "fadeIn .5s ease",
  borderRadius: 4,
  boxShadow: "5px 5px 10px 0px #000",
  pointerEvents,
};

export class CmdlineComponent extends React.Component<Props, States> {
  private renderer?: Context2D;

  constructor(props: Props) {
    super(props);

    this.state = { visible: false };
    ipcRenderer.on("cmdline:show", this.onCmdline.bind(this));
    ipcRenderer.on("cmdline:cursor", this.onCursor.bind(this));
    ipcRenderer.on("cmdline:flush", this.onFlush.bind(this));
    ipcRenderer.on("cmdline:hide", this.offCmdline.bind(this));
  }

  componentDidUpdate() {
    const ctx = (this.refs.canvas as HTMLCanvasElement)?.getContext("2d");

    if (ctx) {
      this.renderer = new Context2D(ctx, this.getRenderFont());
    }
  }

  componentWillUnmount() {
    ipcRenderer.removeAllListeners("cmdline:show");
    ipcRenderer.removeAllListeners("cmdline:cursor");
    ipcRenderer.removeAllListeners("cmdline:flush");
    ipcRenderer.removeAllListeners("cmdline:hide");
  }

  private getRenderFont() {
    return { size: this.props.font.size * 2, width: this.props.font.width * 2, height: this.props.font.height * 2 };
  }

  private onCmdline(_: IpcRendererEvent) {
    this.state.visible || this.setState({ visible: true });
  }

  private onCursor(_: IpcRendererEvent, x: number, y: number, hl: number) {
    this.renderer?.setCursor(x, y, hl);
  }

  private onFlush(_: IpcRendererEvent, cells: ICell[]) {
    this.renderer?.flush(cells);
  }

  private offCmdline() {
    delete(this.renderer);
    this.state.visible && this.setState({ visible: false });
  }

  private getStyle() {
    return {
      ...style,
      ...this.props.win,
      background: Highlights.color(0, "background"),
    };
  }

  render() {
    return this.state.visible === false ? null : (
      <canvas style={this.getStyle()} width={this.props.win.width * 2} height={this.props.win.height * 2} ref="canvas"></canvas>
    );
  }
}
