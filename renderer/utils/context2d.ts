import { Grid } from "../canvas/grid";

interface Highlight {
  foreground: number;
  background: number;
  special: number;
  reverse: boolean;
  italic: boolean;
  bold: boolean;
  strikethrough: boolean;
  underline:boolean;
  undercurl:boolean;
  blend: number;
}

export class Context2D {
  private grids: { [k: number]: Grid } = {};
  private highlights: { [k: number]: Highlight } = {};

  constructor(
    private ctx: CanvasRenderingContext2D,
    private font: { size: number; width: number; height: number; },
  ) { }

  private intToColor(color: number) {
    return `#${("000000" + color.toString(16)).slice(-6)}`;
  }

  private style(hl: number, type: "foreground" | "background") {
    const foreground = this.highlights[hl].foreground || this.highlights[0].foreground;
    const background = this.highlights[hl].background || this.highlights[0].background;
    const reverse = this.highlights[hl].reverse;

    switch (type) {
      case "foreground": return (this.ctx.fillStyle = this.intToColor(reverse ? background : foreground));
      case "background": return (this.ctx.fillStyle = this.intToColor(reverse ? foreground : background));
    }
  }

  private fontStyle(hl: number) {
    this.ctx.textBaseline = "top";
    this.ctx.font = `${this.font.size}px Ricty Diminished, Nerd Font`;
    this.highlights[hl].bold && (this.ctx.font = `${this.font.size}px Ricty Diminished Bold, Nerd Font Bold`);
    this.highlights[hl].italic && (this.ctx.font = `${this.font.size}px Ricty Diminished Oblique`);
  }

  private underline(x: number, y: number, col: number, hl: number) {
    if (this.highlights[hl].underline || this.highlights[hl].undercurl) {
      this.ctx.save();
      this.ctx.strokeStyle = this.intToColor(this.highlights[hl].special || this.highlights[0].special);
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

  text(grid: number, text: string) {
    const { row, col } = this.grids[grid].getCursor();
    const { hl } = this.grids[grid].getCell(row, col);
    const limit = text.length * 2;

    this.flush();
    this.rect(col * this.font.width, row * this.font.height, limit, hl, true);
    this.style(hl, "background");
    this.ctx.fillText(text, col * this.font.width, row * this.font.height);
    for (let i = 0; i < limit; i++) {
      this.grids[grid].moveCell(row, col + i, row, col + i);
    }
  }

  gridResize(grid: number, width: number, height: number) {
    this.grids[grid] = new Grid(0, 0, width, height);
  }

  defaultColorsSet(foreground: number, background: number, special: number) {
    this.highlights[0] = {
      foreground,
      background,
      special,
      reverse: false,
      italic: false,
      bold: false,
      strikethrough: false,
      underline:false,
      undercurl:false,
      blend: 0,
    };
  }

  hlAttrDefine(id: number, rgb: Highlight) {
    this.highlights[id] = rgb;
  }

  gridLine(grid: number, row: number, col: number, cells: string[][]) {
    let i = 0;
    cells.forEach(cell => {
      const repeat = cell[2] || 1;
      for (let j = 0; j < repeat; j++) {
        this.grids[grid].setCell(row, col + i++, cell[0], cell.length > 1 ? +cell[1] : -1);
      }
    });
  }

  gridClear(grid: number) {
    const position = this.grids[grid].position;
    const [y, height] = [position.y * this.font.height, position.height * this.font.height];
    const [x, width] = [position.x * this.font.width, position.width * this.font.width]
    this.ctx.clearRect(x, y, width, height);
    this.style(0, "background");
    this.ctx.fillRect(x, y, width, height);
  }

  gridDestory(grid: number) {
    delete(this.grids[grid]);
  }

  gridCursorGoto(grid: number, row: number, col: number) {
    this.grids[grid].setCursor(row, col);
  }

  gridScroll(grid: number, top: number, bottom: number, left: number, right: number, rows: number, cols: number) {
    const check = (y: number, x: number) => (top <= y && left <= x && y < bottom && x < right);

    this.grids[grid].getLines(0, rows > 0, cell => {
      const [srow, trow] = [cell.row, cell.row - rows];
      const [scol, tcol] = [cell.col, cell.col - cols];
      if (!check(srow, scol)) return;
      if (!check(trow, tcol)) return;
      this.grids[grid].moveCell(srow, scol, trow, tcol);
    });
  }

  flush() {
    Object.values(this.grids).forEach(grid => {
      const { row, col } = grid.getCursor();

      grid.moveCell(row, col, row, col)
      grid.getFlush(cell => {
        const [x, y] = [cell.x * this.font.width, cell.y * this.font.height];
        const reverse = (row === cell.y && col === cell.x);
        this.rect(x, y, cell.width, cell.hl, reverse);
        this.underline(x, y, cell.width, cell.hl);
        this.fontStyle(cell.hl);
        this.style(cell.hl, reverse ? "background" : "foreground");
        this.ctx.fillText(cell.text, x, y);
      });
      grid.moveCell(row, col, row, col)
    });
  }
}
