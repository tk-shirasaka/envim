import React, { ChangeEvent, MouseEvent, WheelEvent, KeyboardEvent } from "react";
import { ipcRenderer, IpcRendererEvent } from "electron";

import { keycode } from "../utils/keycode";
import { IFont } from "../utils/interfaces";
import { Context2D } from "../utils/context2d";

interface Props {
  font: IFont;
}

interface States {
  width: number;
  height: number;
}

const styles = {
  canvas: {
    display: "block",
  },
  input: {
    display: "block",
    height: 0,
    padding: 0,
    margin: 0,
    border: "none",
  },
};

export class EnvimComponent extends React.Component<Props, States> {
  private timer: number = 0;
  private drag: boolean = false;
  private renderer: Context2D;

  constructor(props: Props) {
    super(props);

    this.state = { width: window.innerWidth, height: window.innerHeight };
    this.renderer = new Context2D(this.state, this.props.font)
    window.addEventListener("resize", this.onResize.bind(this));
    ipcRenderer.on("envim:redraw", this.onRedraw.bind(this));
    ipcRenderer.send("envim:resize", ...this.getNvimSize());
  }

  private getNvimSize(width: number = this.state.width, height: number = this.state.height) {
    return [Math.floor(width / this.props.font.width), Math.floor(height / this.props.font.height)];
  }

  private onMouse(e: MouseEvent, button: string, action: string) {
    const [col, row] = this.getNvimSize(e.x, e.y);

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

  private onResize() {
    const timer = +setTimeout(() => {
      if (timer !== this.timer) return;

      this.setState({ width: window.innerWidth, height: window.innerHeight })
      ipcRenderer.send("envim:resize", ...this.getNvimSize());
    }, 200);
    this.timer = timer;
  }

  private onKeyDown(e: KeyboardEvent) {
    const input = this.refs.input as HTMLInputElement;
    const code = keycode(e);

    e.stopPropagation();
    e.preventDefault();
    if (code) {
      ipcRenderer.send("envim:input", `${input.value}${code}`);
      input.value = "";
    } else {
      setTimeout(() => {
        const ctx = (this.refs.canvas as HTMLCanvasElement).getContext("2d");
        ctx && this.renderer.text(ctx, input.value.split(""), true);
      });
    }
  }

  private onRedraw(_: IpcRendererEvent, redraw: any[][]) {
    const canvas = this.refs.canvas as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    this.renderer.reverse(ctx);
    this.renderer.fontStyle(ctx);
    redraw.forEach(r => {
      const name = r.shift();
      switch (name) {
        case "clear":
          this.renderer.clearAll(ctx);
        break;
        case "eol_clear":
          this.renderer.clearEol(ctx);
        break;
        case "resize":
          this.renderer.resize(r[0][0], r[0][1]);
        break;
        case "flush":
          this.renderer.reverse(ctx);
        break;
        case "set_scroll_region":
          this.renderer.scrollRegion(r[0][0], r[0][1], r[0][2], r[0][3]);
        break;
        case "scroll":
          this.renderer.scroll(canvas, ctx, r[0][0]);
        break;
        case "cursor_goto":
          this.renderer.cursor(r[0][0], r[0][1]);
        break;
        case "highlight_set":
          const { foreground, background, special, reverse, bold, italic } = r[0][0];
          this.renderer.highlight(ctx, foreground, background, special, reverse, bold, italic);
        break;
        case "update_fg":
          this.renderer.update(r[0][0], "fg");
        break;
        case "update_bg":
          this.renderer.update(r[0][0], "bg");
        break;
        case "put":
          this.renderer.text(ctx, (r as string[][]).map(c => c[0] || ""));
        break;
      }
    });
  }

  render() {
    return (
      <>
        <canvas style={styles.canvas} width={this.state.width} height={this.state.height} ref="canvas"
          onMouseDown={this.onMouseDown.bind(this)}
          onMouseMove={this.onMouseMove.bind(this)}
          onMouseUp={this.onMouseUp.bind(this)}
          onWheel={this.onMouseWheel.bind(this)}
        />
        <input style={styles.input} onKeyDown={this.onKeyDown.bind(this)} autoFocus={true} ref="input" />
      </>
    );
  }
}
