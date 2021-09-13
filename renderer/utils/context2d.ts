import { ICell, IScroll } from "common/interface";

import { Highlights } from "./highlight";
import { Setting } from "./setting";

export class Context2D {
  private font: { size: number; width: number; height: number; } = { size: 0, width: 0, height: 0 };
  private queues: { cells?: ICell[], scroll?: IScroll }[] = [];
  private move: { x: number, y: number } = { x: 0, y: 0 };

  constructor(
    private bg: CanvasRenderingContext2D,
    private fg: CanvasRenderingContext2D,
    private sp: CanvasRenderingContext2D,
  ) {
    const { size, width, height } = Setting.font;
    this.font = { size: size * 2, width: width * 2, height: height * 2 };
    this.render();
  }

  private style(hl: string, type: "foreground" | "background") {
    const next = Highlights.color(hl, type);
    const ctx = type === "foreground" ? this.fg : this.bg;
    if (ctx.fillStyle !== next) {
      ctx.fillStyle = next;
    }
  }

  private fontStyle(hl: string) {
    const next = Highlights.font(hl, this.font.size);
    if (this.fg.font !== next) {
      this.fg.font = next
    }
    this.fg.textBaseline = "top";
  }

  private decoration(x: number, y: number, width: number, hl: string) {
    const type = Highlights.decoration(hl);

    if (type !== "none") {
      this.sp.strokeStyle = Highlights.color(hl, "special");
      this.sp.beginPath();
      this.sp.lineWidth = 2;

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
            this.sp.arc(x + (i * 4 + 0) * cycle, y + this.font.height - cycle * 2.0, cycle, 0.9 * Math.PI, 0.1 * Math.PI, true);
            this.sp.arc(x + (i * 4 + 2) * cycle, y + this.font.height - cycle * 1.5, cycle, 1.1 * Math.PI, 1.9 * Math.PI, false);
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
    this.rect(x * this.font.width, y * this.font.height, width, height, "0", 0b111);
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

  private scroll(rate: number, scroll: IScroll) {
    const { x, y, width, height, rows, cols } = scroll;
    const [ bg, fg, sp ] = this.getCapture(x, y, width, height);
    const offsetx = (cols < 0 ? Math.min(cols, cols + this.move.x) : Math.max(cols, cols + this.move.x)) * rate ;
    const offsety = (rows < 0 ? Math.min(rows, rows + this.move.y) : Math.max(rows, rows + this.move.y)) * rate ;
    const animate = (ox: number, oy: number) => {
      ox = Math.abs(ox + offsetx) <= Math.abs(cols) ? ox + offsetx : cols;
      oy = Math.abs(oy + offsety) <= Math.abs(rows) ? oy + offsety : rows;

      this.clear(x, y, width, height);
      this.putCapture(bg, fg, sp, x - ox, y - oy, Math.max(0, ox), Math.max(0, oy), Math.min(width, width + ox), Math.min(height, height + oy));
      if (ox === cols && oy === rows) {
        rows && this.putCapture(bg, fg, sp, x, y, 0, rows < 0 ? 0 : height - Math.abs(rows), width, Math.abs(rows));
        cols && this.putCapture(bg, fg, sp, x, y, cols < 0 ? 0 : width - Math.abs(cols), 0, Math.abs(cols), height);
        this.move.x -= cols;
        this.move.y -= rows;
        this.render();
      } else {
        requestAnimationFrame(() => animate(ox, oy));
      }
    };
    animate(0, 0);
  }

  private flush(cells: ICell[]) {
    cells.forEach(cell => {
      const [y, x] = [cell.row * this.font.height, cell.col * this.font.width];
      this.rect(x, y, cell.width, 1, cell.hl, cell.dirty);
      this.decoration(x, y, cell.width, cell.hl);
    });

    cells.forEach(cell => {
      if ([" ", ""].indexOf(cell.text) >= 0 || (cell.dirty & 0b001) === 0) return;

      const [y, x] = [cell.row * this.font.height, cell.col * this.font.width];
      this.fontStyle(cell.hl);
      this.style(cell.hl, "foreground");
      this.fg.fillText(cell.text, x, y + (this.font.height - this.font.size) / 2);
    });
    this.render();
  }

  private render() {
    const flush = this.queues.shift();

    if (flush?.scroll) {
      this.scroll(0.1, flush.scroll);
    } else if (flush?.cells) {
      this.flush(flush.cells);
    } else {
      requestAnimationFrame(() => this.render());
    }
  }

  push(cells: ICell[], scroll?: IScroll) {
    if (scroll) {
      this.move.x += scroll.cols;
      this.move.y += scroll.rows;
      this.queues.push({ scroll });
    }
    if (cells.length) {
      this.queues.push({ cells });
    }
  }
}
