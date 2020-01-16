import React, { MouseEvent, WheelEvent } from "react";
import { ipcRenderer, IpcRendererEvent } from "electron";

import { Context2D } from "../utils/context2d";
import { Emit } from "../utils/emit";

interface Props {
  font: { size: number; width: number; height: number; };
  win: { width: number; height: number; };
}

interface States {
}

const style = {
  cursor: "pointer",
  display: "block",
};

export class CanvasComponent extends React.Component<Props, States> {
  private drag: boolean = false;
  private renderer?: Context2D;

  constructor(props: Props) {
    super(props);

    Emit.on("envim:ime", this.onIme.bind(this));
    ipcRenderer.on("envim:flush", this.onFlush.bind(this));
    ipcRenderer.on("envim:highlights", this.onHighlight.bind(this));
    ipcRenderer.send("envim:resize", ...this.getNvimSize(this.props.win.width, this.props.win.height));
  }

  componentDidMount() {
    const ctx = (this.refs.canvas as HTMLCanvasElement).getContext("2d");
    ctx && (this.renderer = new Context2D(ctx, this.props.font));
  }

  componentDidUpdate() {
    ipcRenderer.send("envim:resize", ...this.getNvimSize(this.props.win.width, this.props.win.height));
  }

  componentWillUnmount() {
    Emit.clear("envim:ime");
    ipcRenderer.removeAllListeners("envim:highlights");
    ipcRenderer.removeAllListeners("envim:flush");
  }

  private getNvimSize(width: number, height: number) {
    return [Math.floor(width / this.props.font.width), Math.floor(height / this.props.font.height)];
  }

  private onMouse(e: MouseEvent, button: string, action: string) {
    const [col, row] = this.getNvimSize(e.clientX, e.clientY);

    button === "left" && e.stopPropagation();
    button === "left" && e.preventDefault();
    ipcRenderer.send("envim:mouse", button, action, row, col);
  }

  private onMouseDown(e: MouseEvent) {
    switch (e.button) {
      case 0:
        this.drag = true;
        this.onMouse(e, "left", "press");
        Emit.send("menu:off");
      break;
      case 2:
        Emit.send("menu:on", e.clientY, e.clientX);
      break;
    }
  }

  private onMouseMove(e: MouseEvent) {
    this.drag && this.onMouse(e, "left", "drag");
  }

  private onMouseUp(e: MouseEvent) {
    this.drag = false;
    this.onMouse(e, "left", "release");
  }

  private onMouseWheel(e: WheelEvent) {
    this.onMouse(e, "wheel", e.deltaY < 0 ? "up" : "down");
  }

  private onIme(text: string) {
    this.renderer?.text(text);
  }

  private onHighlight(_: IpcRendererEvent, highlights: any[][]) {
    console.log(highlights);
    highlights.forEach(([id, hl]) => this.renderer?.setHighlight(id, hl));
  }

  private onFlush(_: IpcRendererEvent, cells: any[]) {
    this.renderer?.flush(cells);
  }

  render() {
    return (
      <canvas style={style} width={this.props.win.width} height={this.props.win.height} ref="canvas"
        onMouseDown={this.onMouseDown.bind(this)}
        onMouseMove={this.onMouseMove.bind(this)}
        onMouseUp={this.onMouseUp.bind(this)}
        onWheel={this.onMouseWheel.bind(this)}
        />
    );
  }
}
