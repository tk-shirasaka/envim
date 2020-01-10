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
  private x: number = 0;
  private y: number = 0;
  private grids: { [k: number]: Grid } = {};
  private highlights: { [k: number]: Highlight } = {};

  constructor(
    private canvas: HTMLCanvasElement,
    private ctx: CanvasRenderingContext2D,
    private win: { width: number; height: number; },
    private font: { size: number; width: number; height: number; },
  ) { }

  private calcSize(size: number, direction: "row" | "col") {
    const type: "width" | "height" = direction === "row" ? "height" : "width";
    return Math.min(this.font[type] * size, this.win[type]);
  }

  private calcPos(row: number, col: number) {
    return [ this.calcSize(row, "row"), this.calcSize(col, "col") ];
  }

  private region(left: number, top: number, right: number, bottom: number) {
    [ top, left ] = this.calcPos(top, left);
    [ bottom, right ] = this.calcPos(bottom, right);
    return [ left, top, right, bottom ];
  }

  private grid(grid: number) {
    const { left, top, right, bottom } = this.grids[grid].position;
    return this.region(left, top, right + 1, bottom + 1);
  }

  private intToColor(color: number) {
    return `#${("000000" + color.toString(16)).slice(-6)}`;
  }

  private style(hl: number, type: "foreground" | "background") {
    const color = this.highlights[hl][type] || this.highlights[0][type];

    this.ctx.fillStyle = this.intToColor(color);
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

  private rect(x: number, y: number, col: number, hl: number) {
    this.ctx.clearRect(x, y, col * this.font.width, this.font.height);
    this.style(hl, "background");
    this.ctx.fillRect(x, y, col * this.font.width, this.font.height);
  }

  resize(win: { width: number; height: number; }, font: { size: number; width: number; height: number; }) {
    this.win = win;
    this.font = font;
  }

  text(grid: number, text: string) {
    const limit = text.length * 2;
    this.gridCursorGoto(grid, this.y, this.x);
    this.rect(this.x, this.y, limit, 0);
    this.style(0, "foreground");
    this.ctx.fillText(text, this.x * this.font.width, this.y * this.font.height);
    for (let i = 0; i < limit; i++) {
      this.grids[grid].resetCell(this.y, this.x + i);
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
        this.grids[grid].setCell(row, col + ++i, cell[0], cell.length > 1 ? +cell[1] : -1);
      }
    });
  }

  gridClear(grid: number) {
    const [x, y, width, height] = this.grid(grid);
    this.ctx.clearRect(x, y, width, height);
    this.style(0, "background");
    this.ctx.fillRect(x, y, width, height);
  }

  gridDestory(grid: number) {
    delete(this.grids[grid]);
  }

  gridCursorGoto(grid: number, row: number, col: number) {
    [this.y, this.x] = [row, col];

    this.grids[grid].getFlush(cell => {
      const [x, y] = [cell.x * this.font.width, cell.y * this.font.height]
      this.rect(x, y, cell.width, cell.hl);
      this.underline(x, y, cell.width, cell.hl);
      this.fontStyle(cell.hl);
      this.style(cell.hl, "foreground");
      this.ctx.fillText(cell.text, x, y);
    });

    this.ctx.save();
    this.ctx.globalCompositeOperation = "exclusion";
    this.ctx.fillStyle = this.intToColor(0xffffff);
    this.ctx.fillRect(this.x * this.font.width, this.y * this.font.height, this.font.width, this.font.height);
    this.ctx.restore();
    this.grids[grid].resetCell(row, col)
  }

  gridScroll(grid: number, top: number, bottom: number, left: number, right: number, rows: number) {
    const check = (x: number, y: number) => (top >= y && left >= x && bottom <= y && right <= x);

    this.grids[grid].getLines(0, rows < 0, cell => {
      if (!check(cell.col, cell.row)) return;
      const method = check(cell.col, cell.row + rows) ? "getCell" : "getDefault";
      const next = this.grids[grid][method](cell.row, cell.col + rows);

      this.grids[grid].setCell(cell.row, cell.col, next.text, next.hl);
    });
  }
}
