import { ICell } from "common/interface";

export class Grid {
  private lines: ICell[][] = [];
  private flush: { [k: string]: ICell } = {};
  private width :number = 0;
  private height: number = 0;
  private offset: { row: number, col: number, zIndex: number } = { row: 0, col: 0, zIndex: 0 };

  constructor(width :number, height: number) {
    this.resize(width, height);
  }

  resize(width :number, height: number) {
    if (this.width === width && this.height === height) return false;
    const old = this.lines;

    this.width = width;
    this.height = height;
    this.lines = [];

    for (let i = 0; i < height; i++) {
      this.lines.push([]);
      for (let j = 0; j < width; j++) {
        const cell = old[i] && old[i][j] ? old[i][j] : this.getDefault(i, j);
        this.lines[i].push(cell);
      }
    }

    return true;
  }

  getSize() {
    return { width: this.width, height: this.height };
  }

  getCursorPos(row: number, col: number) {
    const { width, hl } = this.getCell(row, col);
    row += this.offset.row;
    col += this.offset.col;

    return { col, row, width, hl, zIndex: this.offset.zIndex };
  }

  setOffsetPos(row: number, col: number, zIndex: number) {
    this.offset = { row, col, zIndex };
  }

  getOffsetPos() {
    return this.offset;
  }

  getDefault(row: number, col: number) {
    return { row, col, text: " ", hl: 0, width: 1 };
  }

  getCell(row: number, col: number) {
    return (this.lines[row] && this.lines[row][col]) ? this.lines[row][col] : this.getDefault(row, col);
  }

  setCell(row: number, col: number, text: string, hl: number, asc: boolean = true) {
    const prev = this.getCell(row, col - 1);
    const next = this.getCell(row, col + 1);
    const cell = this.getCell(row, col);

    hl < 0 && (hl = prev.hl);
    asc && text === "" && (prev.width = 2);
    if (cell.text !== text || cell.hl !== hl) {
      this.flush[`${prev.row},${prev.col}`] = prev;
      this.flush[`${cell.row},${cell.col}`] = cell;
      this.flush[`${next.row},${next.col}`] = next;
    };
    [ cell.row, cell.col, cell.text, cell.hl, cell.width ] = [ row, col, text, hl, text.length ];
  }

  scroll(top: number, bottom: number, left: number, right: number, rows: number, cols: number) {
    const ylimit = rows > 0 ? bottom - top - rows : bottom - top + rows;
    const xlimit = cols > 0 ? right - left - cols  : right - left + cols;
    const asc = cols > 0;

    for (let i = 0; i <= ylimit; i++) {
      const trow = rows > 0 ? top + i : bottom - i - 1;
      const srow = trow + rows;
      for (let j = 0; j <= xlimit; j++) {
        const tcol = cols > 0 ? left + j : right - j - 1;
        const scol = tcol + cols;
        const { text, hl } = this.getCell(srow, scol);

        this.setCell(trow, tcol, text, hl, asc);
      }
    }
  }

  getFlush() {
    const flush = this.flush;
    const result: ICell[] = [];

    this.flush = {};
    Object.keys(flush).forEach(k => flush[k].width && result.push(flush[k]));

    return result.sort((a, b) => {
      if (a.row < b.row || (a.row === b.row && a.col < b.col)) return -1;
      if (a.row > b.row || (a.row === b.row && a.col > b.col)) return 1;
      return 0;
    });
  }
}
