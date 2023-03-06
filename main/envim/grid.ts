import { IWindow, ICell, IScroll } from "common/interface";

import { Emit } from "../emit";
import { Highlights } from "./highlight";

class Grid {
  private info: IWindow;
  private lines: { cell: ICell, hl: { fg: number; bg: number; sp: number } }[][] = [];
  private flush: { cells: ICell[], scroll?: IScroll }[] = [];
  private dirty: { [k: string]: ICell } = {};
  private viewport: { top: number; bottom: number; total: number; } = { top: 0, bottom: 0, total: 0 };
  private ready: boolean = false;

  constructor(id: number, width :number, height: number) {
    this.info = { id, winid: 0, x: 0, y: 0, width: 0, height: 0, zIndex: 1, focusable: true, floating: false, status: "show" };
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

  resize(width :number, height: number, clear: boolean = false) {
    if (clear === false && this.info.width === width && this.info.height === height) return;
    const old = clear ? [] : this.lines;

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
    const { width, hl } = this.getCell(y, x).cell;

    y = this.info.status === "show" && this.info.height > y ? y + this.info.y : -1;
    x = this.info.status === "show" && this.info.width > x ? x + this.info.x : -1;

    return { x, y, width, hl, zIndex: this.info.zIndex + 1 };
  }

  setViewport(top: number, bottom: number, total: number) {
    this.viewport = { top, bottom, total };
  }

  getDefault(row: number, col: number) {
    return {
      cell: { row, col, text: " ", hl: "0", width: 0 },
      hl: { fg: 0, bg: 0, sp: 0 },
    };
  }

  refresh() {
    this.lines.forEach(line => line.forEach(({ cell }) => {
      this.setCell(cell.row, cell.col, cell.text, cell.hl);
    }));
  }

  private getCell(row: number, col: number) {
    return (this.lines[row] && this.lines[row][col]) ? this.lines[row][col] : this.getDefault(row, col);
  }

  setCell(row: number, col: number, text: string, hl: string) {
    const prev = this.getCell(row, col - 1).cell;
    const cell = this.getCell(row, col).cell;

    hl = +hl < 0 ? prev.hl : hl;

    const hl1 = Highlights.get(hl);
    const hl2 = this.getCell(row, col).hl;
    const dirty = (hl1.fg ^ hl2.fg || cell.text !== text) || (hl1.bg ^ hl2.bg) || (hl1.sp ^ hl2.sp);

    (text === "") && (prev.width = 2);

    if (dirty) {
      const next = this.getCell(row, col + 1).cell;
      [ cell.text, cell.hl, cell.width ] = [ text, hl, text.length ];
      [ hl2.fg, hl2.bg, hl2.sp, ] = [ hl1.fg, hl1.bg, hl1.sp ];

      this.dirty[`${cell.row},${cell.col}`] = cell;
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

        const scell = this.getCell(srow, scol);
        const tcell = this.getCell(trow, tcol);

        [ tcell.cell.text, tcell.cell.hl, tcell.cell.width ] = [ scell.cell.text, scell.cell.hl, scell.cell.width ];
        [ tcell.hl.fg, tcell.hl.bg, tcell.hl.sp ] = [ scell.hl.fg, scell.hl.bg, scell.hl.sp ];
      }
    }

    this.flush.push({ cells, scroll });
  }

  private getDirty() {
    const dirty = this.dirty;

    this.dirty = {};
    return JSON.parse(JSON.stringify(Object.values(dirty).filter(({ width }) => width)));
  }

  getFlush() {
    if (!this.ready) return {};

    const { flush, viewport } = this;
    this.flush = [];

    const cells = this.getDirty();
    cells.length && flush.push({ cells });

    return { flush, viewport };
  }

  onReady() {
    this.ready = true;
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

  static cursor(grid: number, row: number, col: number) {
    const cursor = Grids.get(grid).getCursorPos(row, col);
    const active = Grids.exist(Grids.active) ? Grids.get(Grids.active).getInfo() : null;

    if (cursor.x >= 0 && cursor.y >= 0 && (Object.keys(Grids.grids).length <= 1 || grid !== Grids.default)) {
      active && active.id !== grid &&  Grids.setStatus(active.id, active.status, active.status === "show");
      Grids.active = grid;
      Grids.setStatus(grid, "show", true);
      Emit.update("grid:cursor", false, cursor);
    }
  }

  static setStatus(grid: number, status: "show" | "hide" | "delete", update: boolean) {
    if (Grids.get(grid).setInfo({ status }) || update) {
      Grids.changes[grid] = grid;
    }
  }

  static refresh() {
    Object.values(Grids.grids).forEach(grid => grid.refresh());
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
    wins.length && Emit.update("win:pos", false, wins);

    Object.values(Grids.grids).map(grid => {
      const { id } = grid.getInfo();
      const { flush, viewport } = grid.getFlush();
      flush && flush.length && Emit.send(`flush:${id}`, flush);
      viewport && Emit.update(`viewport:${id}`, true, viewport.top, viewport.bottom, viewport.total);
    });
  }
}
