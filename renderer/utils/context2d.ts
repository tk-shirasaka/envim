import { ICell } from "common/interface";

import { Highlights } from "./highlight";
import { Setting } from "./setting";

export class Context2D {
  private cursor: { row: number, col: number, hl: number } = { row: 0, col: 0, hl: 0 };
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
    this.ctx.font = `${this.font.size}px ${Highlights.font(hl)}`;
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

  private rect(x: number, y: number, width: number, hl: number, reverse: boolean) {
    this.ctx.clearRect(x, y, width * this.font.width, this.font.height);
    this.style(hl, reverse ? "foreground" : "background");
    this.ctx.fillRect(x, y, width * this.font.width, this.font.height);
  }

  setCursor(cursor: { row: number, col: number, hl: number }) {
    this.cursor = cursor;
  }

  flush(cells: ICell[]) {
    cells.forEach(cell => {
      const [y, x] = [cell.row * this.font.height, cell.col * this.font.width];
      const reverse = (this.cursor.row === cell.row && this.cursor.col === cell.col);
      this.rect(x, y, cell.width, cell.hl, reverse);
      this.underline(x, y, cell.width, cell.hl);
    });
    cells.forEach(cell => {
      const [y, x] = [cell.row * this.font.height, cell.col * this.font.width];
      const reverse = (this.cursor.row === cell.row && this.cursor.col === cell.col);
      this.fontStyle(cell.hl);
      this.style(cell.hl, reverse ? "background" : "foreground");
      this.ctx.fillText(cell.text, x, y, cell.width * this.font.width);
    });
  }
}
