import { ICell, IScroll } from "common/interface";

import { Highlights } from "./highlight";
import { Setting } from "./setting";

export class Context2D {
  private font: { size: number; width: number; height: number; } = { size: 0, width: 0, height: 0 };
  private queues: { cells?: ICell[], scroll?: IScroll }[] = [];
  private move: { x: number, y: number } = { x: 0, y: 0 };
  private deleted: boolean = false;

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

  private rect(x: number, y: number, width: number, height: number, hl: string) {
    this.style(hl, "background");
    this.bg.clearRect(x, y, width * this.font.width, height * this.font.height);
    this.bg.fillRect(x, y, width * this.font.width, height * this.font.height);
    this.fg.clearRect(x, y, width * this.font.width, height * this.font.height);
    this.sp.clearRect(x, y, width * this.font.width, height * this.font.height);
  }

  clear(x: number, y: number, width: number, height: number) {
    this.rect(x * this.font.width, y * this.font.height, width, height, "0");
  }

  getCapture(x: number, y: number, width: number, height: number) {
    return [
      this.bg.getImageData(x * this.font.width, y * this.font.height, width * this.font.width, height * this.font.height),
      this.fg.getImageData(x * this.font.width, y * this.font.height, width * this.font.width, height * this.font.height),
      this.sp.getImageData(x * this.font.width, y * this.font.height, width * this.font.width, height * this.font.height),
    ];
  }

  putCapture(bg: ImageData, fg: ImageData, sp: ImageData, x: number, y: number) {
    this.bg.putImageData(bg, x * this.font.width, y * this.font.height);
    this.fg.putImageData(fg, x * this.font.width, y * this.font.height);
    this.sp.putImageData(sp, x * this.font.width, y * this.font.height);
  }

  private scroll(rate: number, scroll: IScroll) {
    const { x, y, width, height, rows, cols } = scroll;
    const [ dx, dy ] = [ Math.max(x, x + cols), Math.max(y, y + rows) ];
    const [ bg, fg, sp ] = this.getCapture(dx, dy, width - Math.abs(cols), height - Math.abs(rows));
    const limitx = cols < 0 ? [ Math.min, Math.max ] : [ Math.max, Math.min ];
    const limity = rows < 0 ? [ Math.min, Math.max ] : [ Math.max, Math.min ];
    const animate = (ox: number, oy: number) => {
      const tx = cols + limitx[0](0, this.move.x);
      const ty = rows + limity[0](0, this.move.y);

      ox = limitx[1](cols, ox + tx * rate);
      oy = limity[1](rows, oy + ty * rate);

      this.clear(x, y, width, height);
      this.putCapture(bg, fg, sp, dx - ox, dy - oy);
      if (ox === cols && oy === rows) {
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
      this.rect(x, y, cell.width, 1, cell.hl);
      this.decoration(x, y, cell.width, cell.hl);
    });

    cells.forEach(cell => {
      if (cell.text === " ") return;

      const [y, x] = [cell.row * this.font.height, cell.col * this.font.width];
      this.fontStyle(cell.hl);
      this.style(cell.hl, "foreground");
      this.fg.fillText(cell.text, x, y + (this.font.height - this.font.size) / 2);
    });
    this.render();
  }

  private render() {
    if (this.deleted) return;
    const flush = this.queues.shift();

    if (flush?.scroll) {
      this.scroll(0.1, flush.scroll);
    } else if (flush?.cells) {
      this.flush(flush.cells);
    } else {
      requestAnimationFrame(() => this.render());
    }
  }

  push(queue: { cells?: ICell[], scroll?: IScroll }) {
    if (queue.scroll) {
      this.move.x += queue.scroll.cols;
      this.move.y += queue.scroll.rows;
    }
    this.queues.push(queue);
  }
}
