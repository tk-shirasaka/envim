import { Tabpage } from "neovim/lib/api/Tabpage";

import { Browser } from "../browser";
import { Grid } from "./grid";
import { Cmdline } from "./cmdline";

export class App {
  private grids: { [k: number]: Grid } = {};
  private cmdline: Cmdline = new Cmdline;
  private window: { width: number; height: number; } = { width: 0, height: 0 };

  redraw(redraw: any[][]) {
    redraw.forEach(r => {
      const name = r.shift();
      switch (name) {
        /** ext_linegrid **/
        case "grid_resize":
          this.gridResize(r[0][0], r[0][1], r[0][2]);
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

        /** ext_tabline **/
        case "tabline_update":
          this.tablineUpdate(r[0][0], r[0][1]);
        break;

        /** ext_cmdline **/
        case "cmdline_show":
          this.cmdlineShow(r[0][0], r[0][1], r[0][2] || r[0][3], r[0][4]);
        break;
        case "cmdline_pos":
          this.cmdlinePos(r[0][0]);
        break;
        case "cmdline_special_char":
          this.cmdlineSpecialChar(r[0][0], r[0][1]);
        break;
        case "cmdline_hide":
          this.cmdlineHide();
        break;
        case "cmdline_block_show":
          this.cmdlineBlockShow(r[0][0]);
        break;
        case "cmdline_block_append":
          this.cmdlineBlockAppend(r[0][0]);
        break;
        case "cmdline_block_hide":
          this.cmdlineBlockHide();
        break;

        /** ext_popupmenu **/
        case "popupmenu_show":
          this.popupmenuShow(r[0][0], r[0][1], r[0][2], r[0][3], r[0][4]);
        break;
        case "popupmenu_select":
          this.popupmenuSelect(r[0][0]);
        break;
        case "popupmenu_hide":
          this.popupmenuHide();
        break;

        /** ext_popupmenu **/
        case "msg_show":
          r.forEach(r => this.msgShow(r[0], r[1], r[2]));
        break;
        case "msg_showmode":
          this.msgShowmode(r[0][0]);
        break;
        case "msg_clear":
          this.msgClear();
        break;
        case "msg_history_show":
          this.msgHistoryShow(r[0][0]);
        break;

        /** default **/
        case "set_title":
          this.setTitle(r[0][0]);
        break;
        case "busy_start":
          this.busy(true);
        break;
        case "busy_stop":
          this.busy(false);
        break;
        case "flush":
          this.flush();
        break;
      }
    });
  }

  private gridResize(grid: number, width: number, height: number) {
    this.window = { width, height };
    this.grids[grid] = new Grid(width, height);
    this.cmdline.resize(width, height);
  }

  private defaultColorsSet(foreground: number, background: number, special: number) {
    Browser.win?.webContents.send("envim:highlights", [{id: 0, hl: {
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
    }}]);
  }

  private hlAttrDefine(highlights: any[]) {
    highlights = highlights.map(([id, rgb]) => ({id, hl: rgb}));
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
    Browser.win?.webContents.send("envim:cursor", this.grids[grid].setCursorPos(row, col));
  }

  private gridScroll(grid: number, top: number, bottom: number, left: number, right: number, rows: number, cols: number) {
    const check = (row: number, col: number) => (top <= row && left <= col && row < bottom && col < right);

    this.grids[grid].getLines(0, rows > 0, cell => {
      const [srow, trow] = [cell.row, cell.row - rows];
      const [scol, tcol] = [cell.col, cell.col - cols];
      if (!check(srow, scol)) return;
      if (!check(trow, tcol)) return;
      this.grids[grid].moveCell(srow, scol, trow, tcol);
    });
  }

  private async tablineUpdate(current: Tabpage, tabs: { tab: Tabpage, name: string }[]) {
    const next: { name: string, type: string, active: boolean }[] = [];
    for (let i = 0; i < tabs.length; i++) {
      const { tab, name } = tabs[i];
      const buffer = await tab.window.buffer;
      const type = await current.request("nvim_buf_get_option", [buffer.data, "filetype"])
      next.push({
        name,
        type,
        active: current.data === tab.data,
      });
    }
    Browser.win?.webContents.send("envim:tabline", next);
  }

  private cmdlineShow(content: string[][], pos: number, prompt: string, indent: number) {
    const { cursor, cells } = this.cmdline.show(content, pos, prompt, indent);
    Browser.win?.webContents.send("cmdline:show");
    Browser.win?.webContents.send("cmdline:cursor", cursor);
    Browser.win?.webContents.send("cmdline:flush", cells);
  }

  private cmdlinePos(pos: number) {
    const { cursor, cells } = this.cmdline.pos(pos);
    Browser.win?.webContents.send("cmdline:cursor", cursor);
    Browser.win?.webContents.send("cmdline:flush", cells);
  }

  private cmdlineSpecialChar(c: string, shift: boolean) {
    const { cursor, cells } = this.cmdline.specialchar(c, shift);
    Browser.win?.webContents.send("cmdline:cursor", cursor);
    Browser.win?.webContents.send("cmdline:flush", cells);
  }

  private cmdlineHide() {
    this.cmdline.hide();
    Browser.win?.webContents.send("cmdline:hide");
  }

  private cmdlineBlockShow(lines: string[][][]) {
    this.cmdline.blockShow(lines);
  }

  private cmdlineBlockAppend(line: string[][]) {
    this.cmdline.blockAppend(line);
  }

  private cmdlineBlockHide() {
    this.cmdline.blockHide();
    Browser.win?.webContents.send("cmdline:hide");
  }

  private popupmenuShow(items: string[][], selected: number, row: number, col: number, grid: number) {
    const height = Math.min(5, items.length);
    grid < 0 && (row = this.window.height - 1);
    row = row + height > this.window.height ? row - height : row + 1;
    col = Math.min(col, this.window.width - 10);

    Browser.win?.webContents.send("popupmenu:show", {
      items: items.map(([ word, kind, menu, info ]) => ({ word, kind, menu, info })),
      selected,
      start: 0,
      row,
      col,
    });
  }

  private popupmenuSelect(selected: number) {
    Browser.win?.webContents.send("popupmenu:select", selected);
  }

  private popupmenuHide() {
    Browser.win?.webContents.send("popupmenu:hide");
  }

  private msgShow(kind: string, content: string[][], replace_last: boolean) {
    Browser.win?.webContents.send("messages:show", 1, kind, content, replace_last);
  }

  private msgShowmode(content: string[][]) {
    if (content.length) {
      Browser.win?.webContents.send("messages:show", 2, "", content, true);
    } else {
      Browser.win?.webContents.send("messages:clear", 2);
    }
  }

  private msgClear() {
    Browser.win?.webContents.send("messages:clear", 1);
  }

  private msgHistoryShow(contents: string[][][]) {
    Browser.win?.webContents.send("messages:history", contents.map(([kind, content]) => ({ kind, content })));
  }

  private setTitle(title: string) {
    Browser.win?.webContents.send("envim:title", title);
  }

  private busy(busy: boolean) {
    Object.values(this.grids).forEach(grid => grid.setBusy(busy));
  }

  private flush() {
    Object.values(this.grids).forEach(grid => {
      Browser.win?.webContents.send("envim:flush", grid.getFlush());
    });
  }
}
