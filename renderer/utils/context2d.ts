import { ICell, IScroll } from "common/interface";

import { Highlights } from "./highlight";
import { Setting } from "./setting";

export class Context2D {
  private bgcanvas: HTMLCanvasElement;
  private bgctx: CanvasRenderingContext2D;
  private textcanvases: { canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D }[] = [];
  private font: { size: number; width: number; height: number; } = { size: 0, width: 0, height: 0 };
  private queues: { cells?: ICell[], scroll?: IScroll }[] = [];
  private scrolltmp?: { i: number; capture: HTMLCanvasElement; };
  private rendering: boolean = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private ctx: CanvasRenderingContext2D,
    private lighten: boolean,
  ) {
    const { size, width, height, scale } = Setting.font;
    const bg = this.getCanvas();

    this.font = { size: size * scale, width: width * scale, height: height * scale };
    this.bgcanvas = bg.canvas;
    this.bgctx = bg.ctx;
    this.textcanvases = [ this.getCanvas(), this.getCanvas(), this.getCanvas(), this.getCanvas() ];
    this.clear(0, 0, canvas.width, canvas.height);
  }

  update(lighten: boolean) {
    const { canvas, ctx } = this.getCanvas();
    const bgcanvas = this.bgcanvas;

    this.lighten = lighten;
    this.bgcanvas = canvas;
    this.bgctx = ctx;
    this.clear(0, 0, canvas.width, canvas.height);
    this.bgctx.clearRect(0, 0, bgcanvas.width, bgcanvas.height);
    this.bgctx.drawImage(bgcanvas, 0, 0);
    this.ctx.drawImage(canvas, 0, 0);
    this.textcanvases = [ this.getCanvas(), this.getCanvas(), this.getCanvas(), this.getCanvas() ];
  }

  private getCanvas() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!canvas || !ctx) throw "Failed create canvas";

    canvas.width = this.canvas.width;
    canvas.height = this.canvas.height;
    ctx.lineWidth = Setting.font.scale;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";

    return { canvas, ctx };
  }

  private style(hl: string, type: "foreground" | "background" | "special") {
    const color = Highlights.color(hl, type, { lighten: this.lighten });
    const field = type === "special" ? "strokeStyle" : "fillStyle";

    this.bgctx[field] === color || (this.bgctx[field] = color);

    if (type === "foreground") {
      const font = Highlights.font(hl, this.font.size);

      this.bgctx.font === font || (this.bgctx.font = font);
    }
  }

  private decoration(x: number, y: number, width: number, hl: string) {
    const font = this.font
    const lineWidth = this.bgctx.lineWidth;

    Highlights.decoration(hl).forEach(type => {
      this.style(hl, "special");
      this.bgctx.beginPath();
      this.bgctx.setLineDash([]);

      switch(type) {
        case "strikethrough":
        case "underline":
          const line = type === "underline" ? font.height - lineWidth : Math.floor((font.height + lineWidth) / 2);

          this.bgctx.moveTo(x, y + line);
          this.bgctx.lineTo(x + width * this.font.width, y + line);
          break;

        case "underdouble":
          this.bgctx.moveTo(x, y + font.height - lineWidth);
          this.bgctx.lineTo(x + width * font.width, y + font.height - lineWidth);
          this.bgctx.moveTo(x, y + font.height - lineWidth * 3);
          this.bgctx.lineTo(x + width * font.width, y + font.height - lineWidth * 3);
          break;

        case "underdotted":
        case "underdashed":
          const segment = type === "underdotted" ? [lineWidth * 2] : [lineWidth * 3, lineWidth];
          this.bgctx.setLineDash(segment);
          this.bgctx.moveTo(x, y + font.height - lineWidth);
          this.bgctx.lineTo(x + width * font.width, y + font.height - lineWidth);
          break;

        case "undercurl":
          const cycle = font.width / 8;
          for (let i = 0; i < width * 2; i++) {
            this.bgctx.arc(x + (i * 4 + 1) * cycle, y + font.height - cycle * 2.0, cycle, 0.9 * Math.PI, 0.1 * Math.PI, true);
            this.bgctx.arc(x + (i * 4 + 3) * cycle, y + font.height - cycle * 1.5, cycle, 1.1 * Math.PI, 1.9 * Math.PI, false);
          }
          break;
      }

      this.bgctx.stroke()
    });
  }

  private rect(x: number, y: number, width: number, height: number, hl: string) {
    this.style(hl, "background");
    this.bgctx.clearRect(x, y, width * this.font.width, height * this.font.height);
    this.bgctx.fillRect(x, y, width * this.font.width, height * this.font.height);
  }

  clear(x: number, y: number, width: number, height: number) {
    this.rect(x * this.font.width, y * this.font.height, width, height, "0");
  }

  private getCapture() {
    const { canvas, ctx } = this.getCanvas();

    ctx.drawImage(this.bgcanvas, 0, 0);

    return canvas;
  }

  private putCapture(capture: HTMLCanvasElement, x: number, y: number, dx: number = 0, dy: number = 0, dwidth: number = 0, dheight: number = 0) {
    const width = dwidth * this.font.width || capture.width;
    const height = dheight * this.font.height || capture.height;
    this.bgctx.clearRect(dx * this.font.width, dy * this.font.height, width, height);
    this.bgctx.drawImage(capture, x * this.font.width, y * this.font.height, width, height, dx * this.font.width, dy * this.font.height, width, height);
    this.queues.length || this.queues.push({});
  }

  private scroll(limit: number, scroll: IScroll) {
    if (!this.scrolltmp) {
      const capture = this.getCapture();
      this.scrolltmp = { i: 0, capture };
    }

    const { x, y, width, height, rows, cols } = scroll;
    const i = Math.min(limit, this.scrolltmp.i + 1);
    const { capture } = this.scrolltmp;
    const ox = Math.ceil(cols * (i / limit) * this.font.width) / this.font.width;
    const oy = Math.ceil(rows * (i / limit) * this.font.height) / this.font.height;

    this.clear(x, y, width, height);
    this.putCapture(capture, Math.max(x, x + ox), Math.max(y, y + oy), Math.max(x, x - ox), Math.max(y, y - oy), width - Math.abs(ox), height - Math.abs(oy));

    if (ox === cols && oy === rows) {
      rows && this.putCapture(capture, x, rows < 0 ? y : y + height - rows, x, rows < 0 ? y : y + height - rows, width, Math.abs(rows));
      cols && this.putCapture(capture, cols < 0 ? x : x + width - cols, y, cols < 0 ? x : x + width - cols, y, Math.abs(cols), height);
      delete(this.scrolltmp);
    } else {
      this.scrolltmp.i = i;
      this.queues.unshift({ scroll });
    }

    return !!this.scrolltmp;
  }

  private flush(cells: ICell[]) {
    this.textcanvases.forEach((text) => text.ctx.clearRect(0, 0, text.canvas.width, text.canvas.height));

    cells.forEach(cell => {
      const [y, x] = [cell.row * this.font.height, cell.col * this.font.width];
      this.rect(x, y, cell.width, 1, cell.hl);
    });

    cells.forEach(cell => {
      const [y, x] = [cell.row * this.font.height, cell.col * this.font.width];
      this.decoration(x, y, cell.width, cell.hl);
    });

    cells.forEach(cell => {
      if ([" ", ""].indexOf(cell.text) >= 0) return;

      const bgctx = this.bgctx;
      const [y, x] = [cell.row * this.font.height, cell.col * this.font.width];
      this.bgctx = this.textcanvases[((cell.row % 2 ? 0 : 2) + cell.col) % 4].ctx;
      this.style(cell.hl, "foreground");
      this.bgctx.fillText(cell.text, x, y + (this.font.height - this.font.size) / 2);
      this.bgctx.clearRect(x - this.font.width, y, this.font.width, this.font.height);
      this.bgctx.clearRect(x, y - this.font.height, this.font.width, this.font.height);
      this.bgctx.clearRect(x, y + this.font.height, this.font.width, this.font.height);
      this.bgctx = bgctx;
    });

    this.textcanvases.forEach(({ canvas }) => this.bgctx.drawImage(canvas, 0, 0));
  }

  render(nest: boolean = false) {
    const flush = this.rendering ? {} : this.queues.shift();

    this.rendering = true;

    if (flush?.scroll) {
      this.rendering = this.scroll(this.queues.length < 2 ? 5 : 1, flush.scroll);
      this.render(true);
    } else if (flush?.cells) {
      this.flush(flush.cells);
      this.rendering = false;
      this.render(true);
    }

    this.rendering = false;

    if (flush && !nest) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(this.bgcanvas, 0, 0);
    }

    return this.queues.length > 0;
  }

  push(cells: ICell[], scroll?: IScroll) {
    if (cells.length) {
      this.queues.push({ cells });
    }
    if (scroll) {
      this.queues.push({ scroll });
    }
  }
}
