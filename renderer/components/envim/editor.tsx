import React, { MouseEvent, WheelEvent } from "react";
import { ipcRenderer, IpcRendererEvent } from "electron";

import { ICell, IHighlight } from "common/interface";

import { Context2D } from "../../utils/context2d";
import { Emit } from "../../utils/emit";

interface Props {
  font: { size: number; width: number; height: number; };
  win: { width: number; height: number; };
}

interface States {
}

const style = {
  cursor: "text",
  display: "block",
};

export class EditorComponent extends React.Component<Props, States> {
  private drag: boolean = false;
  private renderer?: Context2D;
  private offset?: { x: number, y: number };

  constructor(props: Props) {
    super(props);

    Emit.on("envim:ime", this.onIme.bind(this));
    ipcRenderer.on("envim:cursor", this.onCursor.bind(this));
    ipcRenderer.on("envim:highlights", this.onHighlight.bind(this));
    ipcRenderer.on("envim:flush", this.onFlush.bind(this));
    ipcRenderer.send("envim:resize", ...this.getNvimSize(this.props.win.width, this.props.win.height));
  }

  componentDidMount() {
    const canvas = this.refs.canvas as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const { x, y } = canvas.getBoundingClientRect();
      this.renderer = new Context2D(ctx, this.getRenderFont());
      this.offset = { x, y };
    }
  }

  componentDidUpdate() {
    this.renderer?.setFont(this.getRenderFont());
    ipcRenderer.send("envim:resize", ...this.getNvimSize(this.props.win.width, this.props.win.height));
  }

  componentWillUnmount() {
    Emit.clear("envim:ime");
    ipcRenderer.removeAllListeners("envim:cursor");
    ipcRenderer.removeAllListeners("envim:highlights");
    ipcRenderer.removeAllListeners("envim:flush");
  }

  private getRenderFont() {
    return { size: this.props.font.size * 2, width: this.props.font.width * 2, height: this.props.font.height * 2 };
  }

  private getNvimSize(width: number, height: number) {
    return [Math.floor(width / this.props.font.width), Math.floor(height / this.props.font.height)];
  }

  private onMouse(e: MouseEvent, button: string, action: string) {
    const { x, y } = this.offset || { x: 0, y: 0 };
    const [col, row] = this.getNvimSize(e.clientX - x, e.clientY - y);

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

  private onCursor(_: IpcRendererEvent, x: number, y: number, hl: number) {
    this.renderer?.setCursor(x, y, hl);
  }

  private onHighlight(_: IpcRendererEvent, highlights: {id: number, hl: IHighlight}[]) {
    highlights.forEach(({id, hl}) => this.renderer?.setHighlight(id, hl));
  }

  private onFlush(_: IpcRendererEvent, cells: ICell[]) {
    this.renderer?.flush(cells);
  }

  render() {
    return (
      <canvas style={{...this.props.win, ...style}} width={this.props.win.width * 2} height={this.props.win.height * 2} ref="canvas"
        onMouseDown={this.onMouseDown.bind(this)}
        onMouseMove={this.onMouseMove.bind(this)}
        onMouseUp={this.onMouseUp.bind(this)}
        onWheel={this.onMouseWheel.bind(this)}
        />
    );
  }
}
