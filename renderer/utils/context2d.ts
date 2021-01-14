import { ICell } from "common/interface";

import { Highlights } from "./highlight";
import { Setting } from "./setting";

export class Context2D {
  private font: { size: number; width: number; height: number; } = { size: 0, width: 0, height: 0 };

  constructor(
    private ctx: CanvasRenderingContext2D,
  ) {
    const { size, width, height } = Setting.font;
    this.font = { size: size * 2, width: width * 2, height: height * 2 };
  }

  private style(hl: number, type: "foreground" | "background") {
    this.ctx.fillStyle = Highlights.color(hl, type);
  }

  private fontStyle(hl: number) {
    this.ctx.textBaseline = "top";
    this.ctx.font = Highlights.font(hl, this.font.size);
  }

  private underline(x: number, y: number, width: number, hl: number) {
    if (Highlights.decoration(hl)) {
      this.ctx.save();
      this.ctx.strokeStyle = Highlights.color(hl, "special");
      this.ctx.beginPath();
      this.ctx.moveTo(x, y + this.font.height - 1);
      this.ctx.lineTo(x + width * this.font.width, y + this.font.height - 1);
      this.ctx.closePath();
      this.ctx.stroke()
      this.ctx.restore();
    }
  }

  private rect(x: number, y: number, width: number, hl: number, fill: boolean) {
    this.ctx.clearRect(x, y, width * this.font.width, this.font.height);
    if (fill) {
      this.style(hl, "background");
      this.ctx.fillRect(x, y, width * this.font.width, this.font.height);
    }
  }

  clear(fill: boolean, width: number, height: number) {
    this.style(0, "background");
    this.ctx.clearRect(0, 0, width * 2, height * 2);
    fill && this.ctx.fillRect(0, 0, width * 2, height * 2);
  }

  flush(cells: ICell[]) {
    cells.forEach(cell => {
      const [y, x] = [cell.row * this.font.height, cell.col * this.font.width];
        this.rect(x, y, cell.width, cell.hl, cell.text !== null);
        this.underline(x, y, cell.width, cell.hl);
    });
    cells.forEach(cell => {
      if (cell.text === ' ') return;

      const [y, x] = [cell.row * this.font.height, cell.col * this.font.width];
      this.fontStyle(cell.hl);
      this.style(cell.hl, "foreground");
      this.ctx.fillText(cell.text, x, y + 1);
    });
  }
}
