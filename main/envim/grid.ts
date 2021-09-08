import { ICell } from "common/interface";

import { Emit } from "../emit";
import { Highlights } from "./highlight";

class Grid {
  private lines: ICell[][] = [];
  private flush: { [k: string]: ICell } = {};
  private info: {
    width: number;
    height: number;
    zIndex: number;
    offset: { row: number, col: number };
    focusable: boolean;
  };

  constructor(width :number, height: number) {
    this.info = { width: 0, height: 0, zIndex: 1, offset: { row: 0, col: 0 }, focusable: true };
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
    const { width, hl } = this.getCell(row, col);

    row = this.info.height <= row ? -1 : row + this.info.offset.row;
    col = this.info.width <= col ? -1 : col + this.info.offset.col;

    return { col, row, width, hl, zIndex: this.info.zIndex + 1 };
  }

  getDefault(row: number, col: number) {
    return { row, col, text: " ", hl: "0", width: 0, dirty: 0 };
  }

  getCell(row: number, col: number) {
    return (this.lines[row] && this.lines[row][col]) ? this.lines[row][col] : this.getDefault(row, col);
  }

  setCell(row: number, col: number, text: string, hl: string, width: number) {
    const prev = this.getCell(row, col - 1);
    const cell = this.getCell(row, col);

    hl = +hl < 0 ? prev.hl : hl;

    const hl1 = Highlights.get(hl);
    const hl2 = Highlights.get(cell.hl);
    const dirty = (this.flush[`${cell.row},${cell.col}`]?.dirty || 0)
      | (hl1.fg === hl2.fg && cell.text === text ? 0 : 0b001)
      | (hl1.bg === hl2.bg ? 0 : 0b010)
      | (hl1.sp === hl2.sp ? 0 : 0b100);

    (width < 0) && (text === "") && (prev.width = 2);
    if (dirty) {
      this.flush[`${prev.row},${prev.col}`] = prev;
      this.flush[`${cell.row},${cell.col}`] = cell;
    }
    [ cell.text, cell.hl, cell.width, cell.dirty ] = [ text, hl, width < 0 ? text.length : width, dirty ];
  }

  scroll(top: number, bottom: number, left: number, right: number, rows: number, cols: number) {
    const y = rows > 0
      ? { limit: bottom - top, start: top, direction: 1 }
      : { limit: bottom - top, start: bottom - 1, direction: -1 };
    const x = cols > 0
      ? { limit: right - left, start: left, direction: 1 }
      : { limit: right - left, start: right - 1, direction: -1 };

    for (let i = 0; i < y.limit; i++) {
      const trow = y.start + y.direction * i;
      const srow = trow + rows;
      for (let j = 0; j < x.limit; j++) {
        const tcol = x.start + x.direction * j;
        const scol = tcol + cols;

        const { text, hl, width } = this.getCell(srow, scol);
        const cell = this.getCell(trow, tcol);

        if (y.limit - i <= Math.abs(rows) || x.limit - j <= Math.abs(cols)) {
          this.setCell(trow, tcol, text, hl, width)
        } else {
          [ cell.text, cell.hl, cell.width ] = [ text, hl, width ];
        }
      }
    }

    return [
      this.getFlush(),
      { x: left, y: top, width: right - left, height: bottom - top, rows, cols }
    ];
  }

  getFlush() {
    const flush = this.flush;
    const cells: ICell[] = [];

    this.flush = {};
    Object.keys(flush).forEach(k => flush[k].width && cells.push(flush[k]));

    return cells.sort((a, b) => (+a.hl) - (+b.hl));
  }
}

export class Grids {
  private static grids: { [k: number]: Grid } = {};
  private static default: 1 = 1;
  private static active: number = 0;
  private static hidden: { [k: number]: boolean } = {};

  static init() {
    Grids.grids = {};
    Grids.active = 0;
    Grids.hidden = {};
  }

  static exist(grid: number) {
    return !!Grids.grids[grid];
  }

  static get(grid: number = Grids.default) {
    if (!Grids.exist(grid)) {
      Grids.grids[grid] = new Grid(0, 0);
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
    const curr = Grids.active;
    const next = grid;

    if (curr !== next) {
      Grids.active = next;
      Grids.hidden[curr] || Grids.show(curr);
      Grids.hidden[next] || Grids.show(next);
    }

    const cursor = Grids.get(grid).getCursorPos(row, col);
    cursor.row < 0 || cursor.col < 0 || Emit.send("grid:cursor", cursor);
  }

  static show(grid: number) {
    const { width, height, offset, focusable, zIndex } = Grids.get(grid).getInfo();
    const active = grid === Grids.active ? 1 : 0;

    Grids.hidden[grid] && delete(Grids.hidden[grid]);

    if (width && height) {
      Emit.send("win:pos", grid, width, height, offset.row, offset.col, focusable, zIndex + active);
    } else {
      Grids.delete(grid);
    }
  }

  static hide(grids: number[]) {
    grids.forEach(grid => Grids.hidden[grid] = true);
    Emit.send("win:hide", grids);
  }
}
