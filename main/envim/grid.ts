interface Cell {
  row: number;
  col: number;
  y: number;
  x: number;
  text: string;
  hl: number;
  width: number;
}

export class Grid {
  private lines: Cell[][] = [];
  private flush: Cell[] = [];
  private x :number = 0;
  private y :number = 0;
  private width :number = 0;
  private height: number = 0;
  private cursor: { row: number, col: number } = { row: 0, col: 0 };

  constructor(y :number, x :number, width :number, height: number) {
    this.resize(y, x, width, height);
  }

  resize(y :number, x :number, width :number, height: number) {
    this.y = y;
    this.x = x;
    this.width = width;
    this.height = height;
    this.lines = [];

    for (let i = 0; i < height; i++) {
      this.lines.push([]);
      for (let j = 0; j < width; j++) {
        const cell = this.getDefault(i, j)
        this.flush.push(cell);
        this.lines[i].push(cell);
      }
    }
  }

  setCursorPos(row: number, col: number) {
    const prev = this.getCell(this.cursor.row, this.cursor.col);
    const cell = this.getCell(row, col);

    this.flush.push(prev);
    this.flush.push(cell);
    this.cursor = { row, col };

    return { x: this.x + col, y: this.y + row, hl: cell.hl };
  }

  getDefault(row: number, col: number) {
    return { row, col, y: this.x + row, x: this.y + col, text: " ", hl: 0, width: 1 };
  }

  getCell(row: number, col: number) {
    return (this.lines[row] && this.lines[row][col]) ? this.lines[row][col] : this.getDefault(row, col);
  }

  setCell(row: number, col: number, text: string, hl: number) {
    const prev = this.getCell(row, col - 1);
    const cell = this.getCell(row, col);
    const next = this.getCell(row, col + 1);

    if (cell.text === text && cell.hl === hl) return;

    text || (prev.width = 2);
    hl < 0 && (hl = prev.hl);
    [ cell.row, cell.col, cell.y, cell.x ] = [ row, col, this.x + row, this.y + col ];
    [ cell.text, cell.hl, cell.width ] = [ text, hl, next.width ? text.length : 2 ];
    this.flush.push(cell);
  }

  moveCell(srow: number, scol: number, trow: number, tcol: number) {
    const { text, hl } = this.getCell(srow, scol);
    this.setCell(trow, tcol, text, hl)
  }

  getFlush() {
    const flush = this.flush;

    this.flush = [];
    return flush;
  }

  getLine(row: number, col: number, fn: (cell: Cell) => void) {
    for (let i = col; i < this.width; i++) {
      fn(this.getCell(row, col + i));
    }
  }

  getLines(row: number, asc: boolean, fn: (cell: Cell) => void) {
    const [offset, direction] = asc ? [0, 1] : [this.height - row - 1, -1];

    for (let i = row; i < this.height; i++) {
      this.getLine(offset + row + i * direction, 0, fn);
    }
  }
}
