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
    ipcRenderer.on("envim:redraw", this.onRedraw.bind(this));
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
    ipcRenderer.removeAllListeners("envim:redraw");
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
    this.renderer?.text(1, text);
  }

  private onRedraw(_: IpcRendererEvent, redraw: any[][]) {
    redraw.forEach(r => {
      const name = r.shift();
      switch (name) {
        case "grid_resize":
          r.forEach(([grid, width, height]) => this.renderer?.gridResize(grid, width, height));
        break;
        case "default_colors_set":
          this.renderer?.defaultColorsSet(r[0][0], r[0][1], r[0][2]);
        break;
        case "hl_attr_define":
          r.forEach(([id, rgb]) => this.renderer?.hlAttrDefine(id, rgb));
        break;
        case "grid_line":
          r.forEach(r => this.renderer?.gridLine(r[0], r[1], r[2], r[3]));
        break;
        case "grid_clear":
          this.renderer?.gridClear(r[0][0]);
        break;
        case "grid_destroy":
          this.renderer?.gridDestory(r[0][0]);
        break;
        case "grid_cursor_goto":
          this.renderer?.gridCursorGoto(r[0][0], r[0][1], r[0][2]);
        break;
        case "grid_scroll":
          this.renderer?.gridScroll(r[0][0], r[0][1], r[0][2], r[0][3], r[0][4], r[0][5], r[0][6]);
        break;
        case "flush":
          this.renderer?.flush();
        break;
      }
    });
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
