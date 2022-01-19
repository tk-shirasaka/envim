import { ICell, IScroll } from "common/interface";

import { Highlights } from "./highlight";
import { Setting } from "./setting";

export class Context2D {
  private font: { size: number; width: number; height: number; } = { size: 0, width: 0, height: 0 };
  private queues: { cells?: ICell[], scroll?: IScroll }[] = [];
  private move: { x: number, y: number } = { x: 0, y: 0 };
  private scrolltmp?: { i: number; bg: ImageData; fg: ImageData; sp: ImageData; };
  private rendering: boolean = false;

  constructor(
    private bg: CanvasRenderingContext2D,
    private fg: CanvasRenderingContext2D,
    private sp: CanvasRenderingContext2D,
    private transparent: boolean,
  ) {
    const { size, width, height, scale } = Setting.font;
    this.font = { size: size * scale, width: width * scale, height: height * scale };
    [bg, fg, sp].forEach(ctx => ctx.lineWidth = scale);
  }

  private style(hl: string, type: "foreground" | "background" | "special") {
    const color = Highlights.color(hl, type, { transparent: this.transparent });
    const ctx = { foreground: this.fg, background: this.bg, special: this.sp }[type];
    const field = type === "special" ? "strokeStyle" : "fillStyle";

    ctx[field] === color || (ctx[field] = color);
    ctx.textBaseline === "top" || (ctx.textBaseline = "top");

    if (type === "foreground") {
      const font = Highlights.font(hl, this.font.size);

      ctx.font === font || (this.fg.font = font);
    }
  }

  private decoration(x: number, y: number, width: number, hl: string, dirty: number) {
    const type = Highlights.decoration(hl);

    if (type !== "none" && dirty & 0b100) {
      this.style(hl, "special");
      this.sp.beginPath();

      switch(type) {
        case "strikethrough":
        case "underline":
          const line = type === "underline" ? this.font.height - 1 : Math.floor(this.font.height / 2);

          this.sp.moveTo(x, y + line);
          this.sp.lineTo(x + width * this.font.width, y + line);
          break;

        case "undercurl":
          const cycle = this.font.width / 8;
          for (let i = 0; i < width * 2; i++) {
            this.sp.arc(x + (i * 4 + 1) * cycle, y + this.font.height - cycle * 2.0, cycle, 0.9 * Math.PI, 0.1 * Math.PI, true);
            this.sp.arc(x + (i * 4 + 3) * cycle, y + this.font.height - cycle * 1.5, cycle, 1.1 * Math.PI, 1.9 * Math.PI, false);
          }
          break;
      }

      this.sp.stroke()
    }
  }

  private rect(x: number, y: number, width: number, height: number, hl: string, dirty: number) {
    if (dirty & 0b001) {
      this.fg.clearRect(x, y, width * this.font.width, height * this.font.height);
    }
    if (dirty & 0b010) {
      this.style(hl, "background");
      this.bg.clearRect(x, y, width * this.font.width, height * this.font.height);
      this.bg.fillRect(x, y, width * this.font.width, height * this.font.height);
    }
    if (dirty & 0b100) {
      this.sp.clearRect(x, y, width * this.font.width, height * this.font.height);
    }
  }

  clear(x: number, y: number, width: number, height: number) {
    this.rect(x * this.font.width, y * this.font.height - 1, width, height, "0", 0b111);
  }

  getCapture(x: number, y: number, width: number, height: number) {
    return [
      this.bg.getImageData(x * this.font.width, y * this.font.height, width * this.font.width, height * this.font.height),
      this.fg.getImageData(x * this.font.width, y * this.font.height, width * this.font.width, height * this.font.height),
      this.sp.getImageData(x * this.font.width, y * this.font.height, width * this.font.width, height * this.font.height),
    ];
  }

  putCapture(bg: ImageData, fg: ImageData, sp: ImageData, x: number, y: number, dx: number = 0, dy: number = 0, dwidth: number = 0, dheight: number = 0) {
    this.bg.putImageData(bg, x * this.font.width, y * this.font.height, dx * this.font.width, dy * this.font.height, dwidth * this.font.width || bg.width, dheight * this.font.height || bg.height);
    this.fg.putImageData(fg, x * this.font.width, y * this.font.height, dx * this.font.width, dy * this.font.height, dwidth * this.font.width || fg.width, dheight * this.font.height || fg.height);
    this.sp.putImageData(sp, x * this.font.width, y * this.font.height, dx * this.font.width, dy * this.font.height, dwidth * this.font.width || sp.width, dheight * this.font.height || sp.height);
  }

  private scroll(limit: number, scroll: IScroll) {
    if (!this.scrolltmp) {
      const [ bg, fg, sp ] = this.getCapture(scroll.x, scroll.y, scroll.width, scroll.height);
      this.scrolltmp = { i: 0, bg, fg, sp };
    }

    const { x, y, width, height, rows, cols } = scroll;
    const { bg, fg, sp } = this.scrolltmp;
    const i = Math.min(limit, this.scrolltmp.i + Math.max(Math.abs(this.move.x), Math.abs(this.move.y)));
    const ox = cols * (i / limit);
    const oy = rows * (i / limit);

    this.clear(x, y, width, height);
    this.putCapture(bg, fg, sp, x - ox, y - oy, Math.max(0, ox), Math.max(0, oy), width - Math.abs(ox), height - Math.abs(oy));

    if (ox === cols && oy === rows) {
      rows && this.putCapture(bg, fg, sp, x, y, 0, rows < 0 ? 0 : height - rows, width, Math.abs(rows));
      cols && this.putCapture(bg, fg, sp, x, y, cols < 0 ? 0 : width - cols, 0, Math.abs(cols), height);
      this.move.x -= cols;
      this.move.y -= rows;
      delete(this.scrolltmp);
    } else {
      this.scrolltmp.i = i;
      this.queues.unshift({ scroll });
    }
  }

  private flush(cells: ICell[]) {
    cells.forEach(cell => {
      const [y, x] = [cell.row * this.font.height, cell.col * this.font.width];
      this.rect(x, y, cell.width, 1, cell.hl, cell.dirty);
      this.decoration(x, y, cell.width, cell.hl, cell.dirty);
    });

    cells.forEach(cell => {
      if ([" ", ""].indexOf(cell.text) >= 0 || (cell.dirty & 0b001) === 0) return;

      const [y, x] = [cell.row * this.font.height, cell.col * this.font.width];
      this.style(cell.hl, "foreground");
      this.fg.fillText(cell.text, x, y + (this.font.height - this.font.size) / 2);
    });
  }

  render() {
    const flush = this.rendering ? {} : this.queues.shift();

    this.rendering = true;

    if (flush?.scroll) {
      this.scroll(5, flush.scroll);
    } else if (flush?.cells) {
      this.flush(flush.cells);
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
      this.move.x += scroll.cols;
      this.move.y += scroll.rows;
      this.queues.push({ scroll });
    }
  }
}
