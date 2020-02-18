import React, { MouseEvent, WheelEvent } from "react";
import { ipcRenderer, IpcRendererEvent } from "electron";

import { ICell, IHighlight } from "common/interface";

import { Emit } from "../../utils/emit";
import { Context2D } from "../../utils/context2d";
import { Highlights } from "../../utils/highlight";
import { font } from "../../utils/font";

interface Props {
  width: number;
  height: number;
}

interface States {
}

const position: "absolute" = "absolute";
const style = {
  position,
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
    ipcRenderer.send("envim:resize", ...this.getNvimSize(this.props.width, this.props.height));
  }

  componentDidMount() {
    const canvas = this.refs.canvas as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const { x, y } = canvas.getBoundingClientRect();
      this.renderer = new Context2D(ctx);
      this.offset = { x, y };
    }
  }

  componentDidUpdate() {
    this.renderer?.setFont();
    ipcRenderer.send("envim:resize", ...this.getNvimSize(this.props.width, this.props.height));
  }

  componentWillUnmount() {
    Emit.clear("envim:ime");
    ipcRenderer.removeAllListeners("envim:cursor");
    ipcRenderer.removeAllListeners("envim:highlights");
    ipcRenderer.removeAllListeners("envim:flush");
  }

  private getNvimSize(x: number, y: number) {
    const { width, height } = font.get();
    return [Math.floor(x / width), Math.floor(y / height)];
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
        Emit.send("envim:focus");
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

  private onCursor(_: IpcRendererEvent, cursor: { row: number, col: number, hl: number }) {
    this.renderer?.setCursor(cursor);
  }

  private onHighlight(_: IpcRendererEvent, highlights: {id: number, hl: IHighlight}[]) {
    highlights.forEach(({id, hl}) => Highlights.setHighlight(id, hl));
  }

  private onFlush(_: IpcRendererEvent, cells: ICell[]) {
    this.renderer?.flush(cells);
  }

  render() {
    return (
      <canvas style={{...this.props, ...style}} width={this.props.width * 2} height={this.props.height * 2} ref="canvas"
        onMouseDown={this.onMouseDown.bind(this)}
        onMouseMove={this.onMouseMove.bind(this)}
        onMouseUp={this.onMouseUp.bind(this)}
        onWheel={this.onMouseWheel.bind(this)}
        />
    );
  }
}
