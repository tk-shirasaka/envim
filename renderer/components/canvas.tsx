import React, { MouseEvent, WheelEvent } from "react";
import { ipcRenderer, IpcRendererEvent } from "electron";
import { EventEmitter } from "events";

import { Context2D } from "../utils/context2d";

interface Props {
  font: { size: number; width: number; height: number; };
  win: { width: number; height: number; };
  emit: EventEmitter;
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

    this.props.emit.on("envim:ime", this.onIme.bind(this));
    ipcRenderer.on("envim:redraw", this.onRedraw.bind(this));
    ipcRenderer.send("envim:resize", ...this.getNvimSize(this.props.win.width, this.props.win.height));
  }

  componentDidMount() {
    const canvas = this.refs.canvas as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    ctx && (this.renderer = new Context2D(canvas, ctx, this.props.win, this.props.font));
  }

  componentDidUpdate() {
    ipcRenderer.send("envim:resize", ...this.getNvimSize(this.props.win.width, this.props.win.height));
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
    this.drag = true;
    this.onMouse(e, "left", "press");
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
    this.renderer?.restore("ime");
    this.renderer?.capture("ime");
    this.renderer?.text(text.split(""), true);
  }

  private onRedraw(_: IpcRendererEvent, redraw: any[][]) {
    this.renderer?.restore("ime");
    this.renderer?.restore("cursor");
    this.renderer?.fontStyle();
    redraw.forEach(r => {
      const name = r.shift();
      switch (name) {
        case "clear":
          this.renderer?.clearAll();
        break;
        case "eol_clear":
          this.renderer?.clearEol();
        break;
        case "resize":
          this.renderer?.resize(r[0][0], r[0][1]);
        break;
        case "flush":
          this.renderer?.flush();
        break;
        case "set_scroll_region":
          this.renderer?.scrollRegion(r[0][0], r[0][1], r[0][2], r[0][3]);
        break;
        case "scroll":
          this.renderer?.scroll(r[0][0]);
        break;
        case "cursor_goto":
          this.renderer?.cursor(r[0][0], r[0][1]);
        break;
        case "highlight_set":
          const { foreground, background, special, reverse, bold, italic } = r[0][0];
          this.renderer?.highlight(foreground, background, special, reverse, bold, italic);
        break;
        case "update_fg":
          this.renderer?.update(r[0][0], "fg");
        break;
        case "update_bg":
          this.renderer?.update(r[0][0], "bg");
        break;
        case "put":
          this.renderer?.text((r as string[][]).map(c => c[0] || ""));
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
