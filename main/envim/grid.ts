import { ICell } from "common/interface";

export class Grid {
  private busy: boolean = false;
  private lines: ICell[][] = [];
  private flush: { [k: string]: ICell } = {};
  private width :number = 0;
  private height: number = 0;
  private cursor: { row: number, col: number } = { row: 0, col: 0 };

  constructor(width :number, height: number) {
    this.resize(width, height);
  }

  resize(width :number, height: number) {
    this.width = width;
    this.height = height;
    this.lines = [];

    for (let i = 0; i < height; i++) {
      this.lines.push([]);
      for (let j = 0; j < width; j++) {
        const cell = this.getDefault(i, j);
        this.lines[i].push(cell);
        this.flush[`${cell.row},${cell.col}`] = cell;
      }
    }
  }

  setCursorPos(row: number, col: number) {
    const prev = this.getCell(this.cursor.row, this.cursor.col);
    const cell = this.getCell(row, col);

    this.flush[`${prev.row},${prev.col}`] = prev;
    this.flush[`${cell.row},${cell.col}`] = cell;
    this.cursor = { row, col };

    return this.busy ? { col: -1, row: -1, hl: 0 } : { col, row, hl: cell.hl };
  }

  getDefault(row: number, col: number) {
    return { row, col, text: " ", hl: 0, width: 1 };
  }

  getCell(row: number, col: number) {
    return (this.lines[row] && this.lines[row][col]) ? this.lines[row][col] : this.getDefault(row, col);
  }

  setCell(row: number, col: number, text: string, hl: number) {
    const prev = this.getCell(row, col - 1);
    const cell = this.getCell(row, col);

    text || (prev.width = 2);
    hl < 0 && (hl = prev.hl);
    (cell.text === text && cell.hl === hl) || (this.flush[`${cell.row},${cell.col}`] = cell);
    [ cell.row, cell.col, cell.text, cell.hl, cell.width ] = [ row, col, text, hl, text.length ];
  }

  moveCell(srow: number, scol: number, trow: number, tcol: number) {
    const { text, hl } = this.getCell(srow, scol);
    this.setCell(trow, tcol, text, hl)
  }

  getFlush() {
    const flush = this.flush;
    const result: ICell[] = [];

    this.flush = {};
    Object.keys(flush).forEach(k => flush[k].width && result.push(flush[k]));

    return result;
  }

  getLine(row: number, col: number, fn: (cell: ICell) => void) {
    for (let i = col; i < this.width; i++) {
      fn(this.getCell(row, col + i));
    }
  }

  getLines(row: number, asc: boolean, fn: (cell: ICell) => void) {
    const [offset, direction] = asc ? [0, 1] : [this.height - row - 1, -1];

    for (let i = row; i < this.height; i++) {
      this.getLine(offset + row + i * direction, 0, fn);
    }
  }

  setBusy(busy: boolean) {
    this.busy = busy
  }
}
