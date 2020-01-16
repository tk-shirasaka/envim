import { Tabpage } from "neovim/lib/api/Tabpage";

import { Browser } from "../browser";
import { Grid } from "./grid";

export class App {
  private grids: { [k: number]: Grid } = {};

  redraw(redraw: any[][]) {
    redraw.forEach(r => {
      const name = r.shift();
      switch (name) {
        case "grid_resize":
          r.forEach(([grid, width, height]) => this.gridResize(grid, width, height));
        break;
        case "default_colors_set":
          this.defaultColorsSet(r[0][0], r[0][1], r[0][2]);
        break;
        case "hl_attr_define":
          this.hlAttrDefine(r);
        break;
        case "grid_line":
          r.forEach(r => this.gridLine(r[0], r[1], r[2], r[3]));
        break;
        case "grid_clear":
          this.gridClear(r[0][0]);
        break;
        case "grid_destroy":
          this.gridDestory(r[0][0]);
        break;
        case "grid_cursor_goto":
          this.gridCursorGoto(r[0][0], r[0][1], r[0][2]);
        break;
        case "grid_scroll":
          this.gridScroll(r[0][0], r[0][1], r[0][2], r[0][3], r[0][4], r[0][5], r[0][6]);
        break;
        case "flush":
          this.flush();
        break;
        case "tabline_update":
          this.tablineUpdate(r[0][0], r[0][1]);
        break;
      }
    });
  }

  private gridResize(grid: number, width: number, height: number) {
    this.grids[grid] = new Grid(0, 0, width, height);
  }

  private defaultColorsSet(foreground: number, background: number, special: number) {
    Browser.win?.webContents.send("envim:highlights", [[0, {
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
    }]]);
  }

  private hlAttrDefine(highlights: any[]) {
    highlights = highlights.map(([id, rgb]) => [id, rgb]);
    Browser.win?.webContents.send("envim:highlights", highlights);
  }

  private gridLine(grid: number, row: number, col: number, cells: string[][]) {
    let i = 0;
    cells.forEach(cell => {
      const repeat = cell[2] || 1;
      for (let j = 0; j < repeat; j++) {
        this.grids[grid].setCell(row, col + i++, cell[0], cell.length > 1 ? +cell[1] : -1);
      }
    });
  }

  private gridClear(grid: number) {
    this.grids[grid].getLines(0, true, ({ row, col }) => {
      const { text, hl } = this.grids[grid].getDefault(row, col);
      this.grids[grid].setCell(row, col, text, hl);
    });
  }

  private gridDestory(grid: number) {
    delete(this.grids[grid]);
  }

  gridCursorGoto(grid: number, row: number, col: number) {
    const { x, y } = this.grids[grid].getCursorPos(row, col);
    const { hl } = this.grids[grid].getCell(row, col);

    this.grids[grid].moveCell(row, col, row, col);
    Browser.win?.webContents.send("envim:cursor", x, y, hl);
  }

  private gridScroll(grid: number, top: number, bottom: number, left: number, right: number, rows: number, cols: number) {
    const check = (y: number, x: number) => (top <= y && left <= x && y < bottom && x < right);

    this.grids[grid].getLines(0, rows > 0, cell => {
      const [srow, trow] = [cell.row, cell.row - rows];
      const [scol, tcol] = [cell.col, cell.col - cols];
      if (!check(srow, scol)) return;
      if (!check(trow, tcol)) return;
      this.grids[grid].moveCell(srow, scol, trow, tcol);
    });
  }

  private tablineUpdate(current: Tabpage, tabs: { tab: Tabpage, name: string }[]) {
    Browser.win?.webContents.send("envim:tabline", tabs.map(({tab, name}) => ({
      name,
      type: "js",
      active: current.data === tab.data,
    })));
  }

  private flush() {
    Object.values(this.grids).forEach(grid => {
      Browser.win?.webContents.send("envim:flush", grid.getFlush());
    });
  }
}
