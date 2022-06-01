import { ICell, IScroll } from "common/interface";

import { Highlights } from "./highlight";
import { Setting } from "./setting";

export class Context2D {
  private font: { size: number; width: number; height: number; } = { size: 0, width: 0, height: 0 };
  private queues: { cells?: ICell[], scroll?: IScroll }[] = [];
  private move: number = 0;
  private scrolltmp?: { i: number; capture: ImageData; };
  private rendering: boolean = false;

  constructor(
    private ctx: CanvasRenderingContext2D,
    private lighten: boolean,
  ) {
    const { size, width, height, scale } = Setting.font;
    this.font = { size: size * scale, width: width * scale, height: height * scale };
    ctx.lineWidth = scale;
  }

  private style(hl: string, type: "foreground" | "background" | "special") {
    const color = Highlights.color(hl, type, { lighten: this.lighten });
    const field = type === "special" ? "strokeStyle" : "fillStyle";

    this.ctx[field] === color || (this.ctx[field] = color);
    this.ctx.textBaseline === "top" || (this.ctx.textBaseline = "top");

    if (type === "foreground") {
      const font = Highlights.font(hl, this.font.size);

      this.ctx.font === font || (this.ctx.font = font);
    }
  }

  private decoration(x: number, y: number, width: number, hl: string) {
    const type = Highlights.decoration(hl);

    if (type !== "none") {
      this.style(hl, "special");
      this.ctx.beginPath();
      this.ctx.setLineDash([]);

      switch(type) {
        case "strikethrough":
        case "underline":
          const line = type === "underline" ? this.font.height - 1 : Math.floor(this.font.height / 2);

          this.ctx.moveTo(x, y + line);
          this.ctx.lineTo(x + width * this.font.width, y + line);
          break;

        case "underlineline":
          this.ctx.moveTo(x, y + this.font.height - 1);
          this.ctx.lineTo(x + width * this.font.width, y + this.font.height - 1);
          this.ctx.moveTo(x, y + this.font.height - this.ctx.lineWidth - 2);
          this.ctx.lineTo(x + width * this.font.width, y + this.font.height - this.ctx.lineWidth - 2);
          break;

        case "underdot":
        case "underdash":
          const segment = this.ctx.lineWidth * (type === "underdot" ? 1 : 2);
          this.ctx.setLineDash([segment, segment]);
          this.ctx.moveTo(x, y + this.font.height - 1);
          this.ctx.lineTo(x + width * this.font.width, y + this.font.height - 1);
          break;

        case "undercurl":
          const cycle = this.font.width / 8;
          for (let i = 0; i < width * 2; i++) {
            this.ctx.arc(x + (i * 4 + 1) * cycle, y + this.font.height - cycle * 2.0, cycle, 0.9 * Math.PI, 0.1 * Math.PI, true);
            this.ctx.arc(x + (i * 4 + 3) * cycle, y + this.font.height - cycle * 1.5, cycle, 1.1 * Math.PI, 1.9 * Math.PI, false);
          }
          break;
      }

      this.ctx.stroke()
    }
  }

  private rect(x: number, y: number, width: number, height: number, hl: string) {
    this.style(hl, "background");
    this.ctx.clearRect(x, y, width * this.font.width, height * this.font.height);
    this.ctx.fillRect(x, y, width * this.font.width, height * this.font.height);
  }

  clear(x: number, y: number, width: number, height: number) {
    this.rect(x * this.font.width, y * this.font.height, width, height, "0");
  }

  getCapture(x: number, y: number, width: number, height: number) {
    return this.ctx.getImageData(x * this.font.width, y * this.font.height, width * this.font.width, height * this.font.height);
  }

  putCapture(capture: ImageData, x: number, y: number, dx: number = 0, dy: number = 0, dwidth: number = 0, dheight: number = 0) {
    this.ctx.putImageData(capture, x * this.font.width, y * this.font.height, dx * this.font.width, dy * this.font.height, dwidth * this.font.width || capture.width, dheight * this.font.height || capture.height);
  }

  private scroll(limit: number, scroll: IScroll) {
    if (!this.scrolltmp) {
      const capture = this.getCapture(scroll.x, scroll.y, scroll.width, scroll.height);
      this.scrolltmp = { i: 0, capture };
    }

    const { x, y, width, height, rows, cols } = scroll;
    const i = Math.min(limit, this.scrolltmp.i + 1);
    const { capture } = this.scrolltmp;
    const ox = Math.ceil(cols * (i / limit));
    const oy = Math.ceil(rows * (i / limit));

    this.clear(x, y, width, height);
    this.putCapture(capture, x - ox, y - oy, Math.max(0, ox), Math.max(0, oy), width - Math.abs(ox), height - Math.abs(oy));

    if (ox === cols && oy === rows) {
      rows && this.putCapture(capture, x, y, 0, rows < 0 ? 0 : height - rows, width, Math.abs(rows));
      cols && this.putCapture(capture, x, y, cols < 0 ? 0 : width - cols, 0, Math.abs(cols), height);
      this.move--;
      delete(this.scrolltmp);
    } else {
      this.scrolltmp.i = i;
      this.queues.unshift({ scroll });
    }

    return !!this.scrolltmp;
  }

  private flush(cells: ICell[]) {
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

      const [y, x] = [cell.row * this.font.height, cell.col * this.font.width];
      this.style(cell.hl, "foreground");
      this.ctx.fillText(cell.text, x, y + (this.font.height - this.font.size) / 2);
    });
  }

  render() {
    const flush = this.rendering ? {} : this.queues.shift();

    this.rendering = true;

    if (flush?.scroll) {
      this.rendering = this.scroll(this.move < 2 ? 5 : 1, flush.scroll);
      this.render();
    } else if (flush?.cells) {
      const cells: { [k: string]: ICell } = {};

      this.queues.unshift(flush);
      while (this.queues.length && this.queues[0].cells) {
        (this.queues.shift()?.cells || []).forEach(cell => {
          cells[`${cell.row}.${cell.col}`] = cell;
        })
      }
      this.flush(Object.values(cells).sort((a, b) => (+a.hl) - (+b.hl)));
      this.rendering = false;
      this.render();
    }

    this.rendering = false;
  }

  push(cells: ICell[], scroll?: IScroll) {
    if (cells.length) {
      this.queues.push({ cells });
    }
    if (scroll) {
      this.move++;
      this.queues.push({ scroll });
    }
  }
}
