export interface Cell {
  row: number;
  col: number;
  y: number;
  x: number;
  text: string;
  hl: number;
  width: number;
  default: boolean;
}

export class Grid {
  private lines: Cell[][] = [];
  flush: Cell[] = [];
  private left :number = 0;
  private top :number = 0;
  private right :number = 0;
  private bottom: number = 0;

  constructor(left :number, top :number, right :number, bottom: number) {
    this.resize(left, top, right, bottom);
  }

  private size() {
    return { width: this.right - this.left, height: this.bottom - this.top };
  }

  get position() {
    const { left, top, right, bottom } = this;
    return { left, top, right, bottom };
  }

  resize(left :number, top :number, right :number, bottom: number) {
    this.left = left;
    this.top = top;
    this.right = right;
    this.bottom = bottom;

    const { width, height } = this.size();
    for (let i = 0; i < height; i++) {
      this.lines.push([]);
      for (let j = 0; j < width; j++) {
        this.lines[i].push(this.getDefault(i, j));
      }
    }
  }

  getDefault(row: number, col: number) {
    return { row, col, y: this.top + row, x: this.left + col, text: " ", hl: 0, width: 1, default: true };
  }

  getCell(row: number, col: number) {
    return (this.lines[row] && this.lines[row][col]) ? this.lines[row][col] : this.getDefault(row, col);
  }

  setCell(row: number, col: number, text: string, hl: number) {
    const cell = this.getCell(row, col);
    const prev = this.getCell(row, col - 1);

    text || (prev.width = 2);
    hl < 0 && (hl = prev.hl);
    [ cell.row, cell.col, cell.y, cell.x ] = [ row, col, this.top + row, this.left + col ];
    [ cell.text, cell.hl, cell.width, cell.default ] = [ text, hl || 0, text.length, false ];
    this.flush.push(cell);
  }

  resetCell(row: number, col: number) {
    const cell = this.getCell(row, col);
    this.setCell(row, col, cell.text, cell.hl)
  }

  getFlush(fn: (cell: Cell) => void) {
    while (this.flush.length) {
      const cell = this.flush.shift() as Cell;
      cell && cell.width && fn(cell);
    }
  }

  getLine(row: number, col: number, fn: (cell: Cell) => void) {
    const { width } = this.size();

    for (let i = col; i < width; i++) {
      const cell = this.getCell(row, col + i);
      cell.width || fn(cell);
    }
  }

  getLines(row: number, asc: boolean, fn: (cell: Cell) => void) {
    const { height } = this.size();
    const [offset, direction] = asc ? [0, 1] : [height - row - 1, -1];

    for (let i = row; i < height; i++) {
      this.getLine(offset + row + i * direction, 0, fn);
    }
  }
}
