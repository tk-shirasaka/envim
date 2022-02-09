import { IWindow, ICell, IScroll } from "common/interface";

import { Emit } from "../emit";
import { Highlights } from "./highlight";

class Grid {
  private info: IWindow;
  private lines: ICell[][] = [];
  private flush: { cells: ICell[], scroll?: IScroll }[] = [];
  private dirty: { [k: string]: ICell } = {};

  constructor(id: number, width :number, height: number) {
    this.info = { id, winid: 0, x: 0, y: 0, width: 0, height: 0, zIndex: 1, focusable: true, transparent: false, status: "show" };
    this.resize(width, height);
  }

  setInfo(info: Object) {
    const { id, ...curr } = this.info;
    const next = { ...curr, ...info };
    const update = JSON.stringify(curr) !== JSON.stringify(next);

    if (update) {
      this.resize(next.width, next.height);
      this.info = { id, ...next };
    }

    return update;
  }

  getInfo() {
    return this.info;
  }

  resize(width :number, height: number) {
    if (this.info.width === width && this.info.height === height) return;
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
  }

  getCursorPos(y: number, x: number) {
    const { width, hl } = this.getCell(y, x);

    y = this.info.status === "show" && this.info.height > y ? y + this.info.y : -1;
    x = this.info.status === "show" && this.info.width > x ? x + this.info.x : -1;

    return { x, y, width, hl, zIndex: this.info.zIndex + 1 };
  }

  getDefault(row: number, col: number) {
    return { row, col, text: " ", hl: "0", width: 0, dirty: 0 };
  }

  getCell(row: number, col: number) {
    return (this.lines[row] && this.lines[row][col]) ? this.lines[row][col] : this.getDefault(row, col);
  }

  setCell(row: number, col: number, text: string, hl: string) {
    const prev = this.getCell(row, col - 1);
    const cell = this.getCell(row, col);

    hl = +hl < 0 ? prev.hl : hl;

    const hl1 = Highlights.get(hl);
    const hl2 = Highlights.get(cell.hl);
    const dirty = (this.dirty[`${cell.row},${cell.col}`]?.dirty || 0)
      | (hl1.fg === hl2.fg && cell.text === text ? 0 : 0b001)
      | (hl1.bg === hl2.bg ? 0 : 0b010)
      | (hl1.sp === hl2.sp ? 0 : 0b100);

    (text === "") && (prev.width = 2);

    [ cell.text, cell.hl, cell.width, cell.dirty ] = [ text, hl, text.length, dirty ];
    (cell.dirty) && (this.dirty[`${cell.row},${cell.col}`] = cell);

    if (cell.dirty & 0b001 && (hl1.fg | hl2.fg) & 0x08000000) {
      const next = this.getCell(row, col + 1);
      next.dirty |= 0b001;
      this.dirty[`${next.row},${next.col}`] = next;
    }
  }

  setScroll(top: number, bottom: number, left: number, right: number, rows: number, cols: number) {
    const cells = this.getDirty();
    const scroll = { x: left, y: top, width: right - left, height: bottom - top, rows, cols };
    const y = rows > 0
      ? { limit: bottom - top - rows, start: top, direction: 1 }
      : { limit: bottom - top + rows, start: bottom - 1, direction: -1 };
    const x = cols > 0
      ? { limit: right - left - cols, start: left, direction: 1 }
      : { limit: right - left + cols, start: right - 1, direction: -1 };

    for (let i = 0; i < y.limit; i++) {
      const trow = y.start + y.direction * i;
      const srow = trow + rows;
      for (let j = 0; j < x.limit; j++) {
        const tcol = x.start + x.direction * j;
        const scol = tcol + cols;

        const { text, hl, width } = this.getCell(srow, scol);
        const cell = this.getCell(trow, tcol);

        [ cell.text, cell.hl, cell.width ] = [ text, hl, width ];
      }
    }

    this.flush.push({ cells, scroll });
  }

  private getDirty() {
    const dirty = this.dirty;
    const cells: ICell[] = [];

    this.dirty = {};
    Object.keys(dirty).forEach(k => dirty[k].width && cells.push(dirty[k]));

    return JSON.parse(JSON.stringify(cells.sort((a, b) => (+a.hl) - (+b.hl))));
  }

  getFlush() {
    const flush = this.flush;
    this.flush = [];

    const cells = this.getDirty();
    cells.length && flush.push({ cells });

    return flush;
  }
}

export class Grids {
  private static grids: { [k: number]: Grid } = {};
  private static default: 1 = 1;
  private static active: number = 0;
  private static changes: { [k: number]: number } = {};

  static init() {
    Grids.grids = {};
    Grids.active = 0;
    Grids.changes = {};
  }

  static exist(grid: number) {
    return !!Grids.grids[grid];
  }

  static get(grid: number = Grids.default) {
    if (!Grids.exist(grid)) {
      Grids.grids[grid] = new Grid(grid, 0, 0);
    }

    return Grids.grids[grid];
  }

  static delete(grid: number) {
    Grids.exist(grid) && delete(Grids.grids[grid]);
  }

  static cursor(grid: number, row: number, col: number) {
    const cursor = Grids.get(grid).getCursorPos(row, col);
    const active = Grids.exist(Grids.active) ? Grids.get(Grids.active).getInfo() : null;

    if (cursor.x >= 0 && cursor.y >= 0) {
      active && active.id !== grid &&  Grids.setStatus(active.id, active.status, active.status === "show");
      Grids.active = grid;
      Grids.setStatus(grid, "show", true);
      Emit.update("grid:cursor", cursor);
    }
  }

  static setStatus(grid: number, status: "show" | "hide" | "delete", update: boolean) {
    if (Grids.get(grid).setInfo({ status }) || update) {
      Grids.changes[grid] = grid;
    }
  }

  static flush() {
    const wins: IWindow[] = Object.values(Grids.changes).map(grid => {
      const info = { ...Grids.get(grid).getInfo() };

      info.zIndex = info.id === Grids.active ? info.zIndex + 1 : info.zIndex;
      info.status = info.width && info.height ? info.status : "delete";

      if (info.status === "delete") {
        delete(Grids.grids[info.id]);
      }

      return info;
    });

    Grids.changes = {};
    wins.length && Emit.update("win:pos", wins);

    Object.values(Grids.grids).map(grid => {
      const { id } = grid.getInfo();
      const flush = grid.getFlush();
      flush.length && Emit.send(`flush:${id}`, flush);
    });
  }
}
