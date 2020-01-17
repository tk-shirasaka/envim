import { ICell, IHighlight } from "common/interface";

import { Highlight } from "./highlight";

export class Context2D {
  private highlights: { [k: number]: Highlight } = {};
  private cursor: { x: number, y: number, hl: number } = { x: 0, y: 0, hl: 0 };

  constructor(
    private ctx: CanvasRenderingContext2D,
    private font: { size: number; width: number; height: number; },
  ) { }

  private style(hl: number, type: "foreground" | "background") {
    this.ctx.fillStyle = this.highlights[hl][type] || this.highlights[0][type];
  }

  private fontStyle(hl: number) {
    this.ctx.textBaseline = "top";
    this.ctx.font = `${this.font.size}px ${this.highlights[hl].font}`;
  }

  private underline(x: number, y: number, col: number, hl: number) {
    if (this.highlights[hl].decoration) {
      this.ctx.save();
      this.ctx.strokeStyle = this.highlights[hl].special || this.highlights[0].special;
      this.ctx.beginPath();
      this.ctx.moveTo(x, y + this.font.height - 1);
      this.ctx.lineTo(x + col * this.font.width, y + this.font.height - 1);
      this.ctx.closePath();
      this.ctx.stroke()
      this.ctx.restore();
    }
  }

  private rect(x: number, y: number, col: number, hl: number, reverse: boolean) {
    this.ctx.clearRect(x, y, col * this.font.width, this.font.height);
    this.style(hl, reverse ? "foreground" : "background");
    this.ctx.fillRect(x, y, col * this.font.width, this.font.height);
  }

  setFont(font: { size: number; width: number; height: number; }) {
    this.font = font;
  }

  setHighlight(id: number, hl: IHighlight) {
    this.highlights[id] = new Highlight(hl);
  }

  setCursor(x: number, y: number, hl: number) {
    this.cursor = { x, y, hl };
  }

  text(text: string) {
    const limit = text.length * 2;

    this.rect(this.cursor.x * this.font.width, this.cursor.y * this.font.height, limit, this.cursor.hl, true);
    this.style(this.cursor.hl, "background");
    this.ctx.fillText(text, this.cursor.x * this.font.width, this.cursor.y * this.font.height);
  }

  flush(cells: ICell[]) {
    cells.forEach(cell => {
      const [x, y] = [cell.x * this.font.width, cell.y * this.font.height];
      const reverse = (this.cursor.y === cell.y && this.cursor.x === cell.x);
      this.rect(x, y, cell.width, cell.hl, reverse);
      this.underline(x, y, cell.width, cell.hl);
      this.fontStyle(cell.hl);
      this.style(cell.hl, reverse ? "background" : "foreground");
      this.ctx.fillText(cell.text, x, y);
    });
  }
}
