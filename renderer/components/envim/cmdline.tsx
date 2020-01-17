import React from "react";
import { ipcRenderer, IpcRendererEvent } from "electron";

import { ICell, ICmdline } from "common/interface";
import { Context2D } from "../../utils/context2d";

interface Props {
  font: { size: number; width: number; height: number; };
  win: { width: number; height: number; };
}

interface States {
  visible: boolean;
}

const position: "absolute" = "absolute";
const style = {
  position,
  opacity: 0.8,
  top: "10%",
  left: "10%",
  right: "10%",
  boxShadow: "4px 4px 4px #141414",
};

export class CmdlineComponent extends React.Component<Props, States> {
  private renderer?: Context2D;
  private cmdline?: ICmdline;
  private blocklines: string[][][] = [];

  constructor(props: Props) {
    super(props);

    this.state = { visible: false };
    ipcRenderer.on("cmdline:show", this.show.bind(this));
    ipcRenderer.on("cmdline:pos", this.pos.bind(this));
    ipcRenderer.on("cmdline:specialchar", this.specialChar.bind(this));
    ipcRenderer.on("cmdline:hide", this.hide.bind(this));
    ipcRenderer.on("cmdline:blockshow", this.blockShow.bind(this));
    ipcRenderer.on("cmdline:blockappend", this.blockAppend.bind(this));
    ipcRenderer.on("cmdline:blockhide", this.blockHide.bind(this));
  }

  componentDidUpdate() {
    const ctx = (this.refs.canvas as HTMLCanvasElement)?.getContext("2d");
    const cells: ICell[] = [];

    if (ctx) {
      const cols = Math.floor(this.props.win.width / this.props.font.width);

      for (let i = 0; i <= this.blocklines.length + 1; i++) {
        for (let j = 0; j < cols; j++) {
          cells.push({row: i, col: j, y: i, x: j, text: " ", hl: 0, width: 1});
        }
      }
      this.renderer = new Context2D(ctx, this.getRenderFont());
      this.renderer.setHighlight(0, { foreground: 0xcecece, background: 0x141414, special: 0x34879f });
      this.renderer.flush(cells);
    }
    if (this.renderer && this.cmdline) {
      const offset = this.cmdline.prompt.length + this.cmdline.indent;
      const cursor = { x: this.cmdline.pos +  offset + 1, y: this.blocklines.length + 0.5 };

      cells.push({row: 0.5, col: 1, y: 0.5, x: 1, text: this.cmdline.prompt, hl: 0, width: 1});
      cells.push({row: cursor.y, col: cursor.x, y: cursor.y, x: cursor.x, text: " ", hl: 0, width: 1});
      [...this.blocklines, this.cmdline.content].forEach((line, row) => {
        if (!this.cmdline) return;
        const offset = this.cmdline.prompt.length + 1 + (row < this.blocklines.length ? 0 : this.cmdline.indent);
        let i = 0;
        line.forEach(([_, text]) => {
          text.split("").forEach(c => {
            cells.push({row: row + 0.5, col: i + offset, y: row + 0.5, x: i++ + offset, text: c, hl: 0, width: c.length});
          });
        });
      });
      this.renderer.setFont(this.getRenderFont());
      this.renderer.setCursor(cursor.x, cursor.y, 0);
      this.renderer.flush(cells);
    }
  }

  componentWillUnmount() {
    ipcRenderer.removeAllListeners("cmdline:show");
    ipcRenderer.removeAllListeners("cmdline:pos");
    ipcRenderer.removeAllListeners("cmdline:specialchar");
    ipcRenderer.removeAllListeners("cmdline:hide");
    ipcRenderer.removeAllListeners("cmdline:blockshow");
    ipcRenderer.removeAllListeners("cmdline:blockappend");
    ipcRenderer.removeAllListeners("cmdline:blockhide");
  }

  private getRenderFont() {
    return { size: this.props.font.size * 2, width: this.props.font.width * 2, height: this.props.font.height * 2 };
  }

  private show(_: IpcRendererEvent, cmdline: ICmdline) {
    this.cmdline = cmdline
    this.setState({ visible: true });
  }

  private pos(_: IpcRendererEvent, pos: number, level: number) {
    if (this.cmdline) {
      this.cmdline = { ...this.cmdline, pos, level }
      this.setState({ visible: true });
    }
  }

  private specialChar(_: IpcRendererEvent, c: string, shift: boolean, level: number) {
    if (this.cmdline) {
      let offset = 0;
      const pos = this.cmdline.pos;

      shift && this.cmdline.pos++;
      this.cmdline.level = level;
      this.cmdline.content.forEach(([_, text], i) => {
        this.cmdline && offset <= pos && offset + text.length <= pos && (this.cmdline.content[i][1] = `${text.slice(0, pos - offset)}${c}${text.slice(pos - offset)}`);
        offset += text.length;
      });
      this.setState({ visible: true });
    }
  }

  private hide() {
    delete(this.renderer);
    this.setState({ visible: false });
  }

  private blockShow(_: IpcRendererEvent, lines: string[][][]) {
    this.blocklines = lines;
    this.setState({ visible: true });
  }

  private blockAppend(_: IpcRendererEvent, lines: string[][]) {
    this.blocklines.push(lines);
    this.setState({ visible: true });
  }

  private blockHide() {
    this.blocklines = [];
    this.setState({ visible: false });
  }

  render() {
    const width = this.props.win.width;
    const height = this.props.win.height + (this.props.font.height * this.blocklines.length);
    return this.state.visible && (
      <canvas style={{width, height, ...style}} width={width * 2} height={height * 2} ref="canvas"></canvas>
    );
  }
}
