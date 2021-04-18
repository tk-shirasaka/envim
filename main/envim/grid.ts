import { ICell } from "common/interface";

import { Emit } from "../emit";

class Grid {
  private lines: ICell[][] = [];
  private flush: { [k: string]: ICell } = {};
  private info: {
    width: number;
    height: number;
    zIndex: number;
    offset: { row: number, col: number };
    focusable: boolean;
  }

  constructor(width :number, height: number) {
    this.info = { width: 0, height: 0, zIndex: 0, offset: { row: 0, col: 0 }, focusable: true };
    this.resize(width, height);
  }

  setInfo(width: number, height: number, zIndex: number, offset: { row: number, col: number }, focusable: boolean) {
    this.resize(width, height);
    this.info = { width, height, zIndex, offset, focusable };
  }

  getInfo() {
    return this.info;
  }

  resize(width :number, height: number) {
    if (this.info.width === width && this.info.height === height) return false;
    const old = this.lines;

    this.info.width = width;
    this.info.height = height;
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

  getCursorPos(row: number, col: number) {
    const { width } = this.getCell(row, col);
    row += this.info.offset.row;
    col += this.info.offset.col;

    return { col, row, width, zIndex: this.info.zIndex };
  }

  getDefault(row: number, col: number) {
    return { row, col, text: " ", hl: 0, width: 0 };
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
    const ylimit = bottom - top - Math.abs(rows);
    const xlimit = right - left - Math.abs(cols);
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

export class Grids {
  private static grids: { [k: number]: Grid } = {};
  private static default: 1 = 1;
  private static active: number = Grids.default;
  private static hidden: { [k: number]: boolean } = {};

  static init() {
    Grids.grids = {};
    Grids.active = Grids.default;
    Grids.hidden = {};
  }

  static add(grid: number, width: number, height: number) {
    Grids.grids[grid] = new Grid(width, height);
  }

  static exist(grid: number) {
    return !!Grids.grids[grid];
  }

  static get(grid: number = Grids.default) {
    if (!Grids.exist(grid)) {
      const { width, height } = Grids.get(Grids.default).getInfo();
      Grids.add(grid, width, height);
    }

    return Grids.grids[grid];
  }

  static all(callback: (id: number, grid: Grid) => void) {
    Object.keys(Grids.grids).forEach(grid => callback(+grid, Grids.grids[+grid]));
  }

  static delete(grid: number) {
    Grids.exist(grid) && delete(Grids.grids[grid]);
  }

  static cursor(grid: number, row: number, col: number) {
    const active = Grids.active;

    if (active !== grid) {
      Grids.active = grid;
      [{ id: active, offset: -1 }, { id: grid, offset: 1 }].forEach(({id, offset}) => {
        if (Grids.exist(id) === false) return;

        const info = Grids.grids[id].getInfo();

        info.zIndex += offset;
        Grids.grids[id].setInfo(info.width, info.height, info.zIndex, info.offset, info.focusable);
        Grids.hidden[id] || Grids.show(id);
      });
    }

    Emit.send("grid:cursor", Grids.grids[grid].getCursorPos(row, col));
  }

  static show(grid: number) {
    const { width, height, offset, focusable, zIndex } = Grids.get(grid).getInfo();

    Grids.hidden[grid] && delete(Grids.hidden[grid]);
    Emit.send("win:pos", grid, width, height, offset.row, offset.col, focusable, zIndex);
  }

  static hide(grid: number) {
    Grids.hidden[grid] = true;
    Emit.send("win:hide", grid);
  }
}
