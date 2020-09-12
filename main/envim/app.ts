import { Tabpage } from "neovim/lib/api/Tabpage";

import { ITab } from "common/interface";

import { Emit } from "../emit";
import { Grid } from "./grid";
import { Messages } from "./messages";

export class App {
  private grids: { [k: number]: Grid } = {};
  private messages: Messages = new Messages;
  private timer: number = 0;

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
        case "hl_group_set":
          this.hlGroupSet(r);
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

        /** ext_multigrid **/
        case "win_pos":
          r.forEach(r => this.winPos(r[0], "NW", 1, r[2], r[3], r[4], r[5], true, 1));
        break;
        case "win_float_pos":
          r.forEach(r => this.winPos(r[0], r[2], r[3], r[4], r[5], 0, 0, r[6], 2));
        break;
        case "win_hide":
          r.forEach(r => this.winHide(r[0]));
        break;
        case "win_close":
          this.winClose(r[0][0]);
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

        /** ext_messages **/
        case "msg_show":
          this.msgShow("notificate", r);
        break;
        case "msg_showmode":
          this.msgShow("mode", [["mode", r[0][0], true]]);
        break;
        case "msg_showcmd":
          this.msgShow("command", [["command", r[0][0], true]]);
        break;
        case "msg_ruler":
          this.msgShow("ruler", [["ruler", r[0][0], true]]);
        break;
        case "msg_clear":
          this.msgShow("notificate", [["", [], true]]);
        break;
        case "msg_history_show":
          this.msgShow("history", r[0][0]);
        break;

        /** default **/
        case "mouse_on":
          this.mouse(true);
        break;
        case "mouse_off":
          this.mouse(false);
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
    if (this.grids[grid]) {
      this.grids[grid].resize(width, height) && Emit.send("grid:resize", grid, width, height);
    } else {
      this.grids[grid] = new Grid(width, height);
    }
  }

  private defaultColorsSet(foreground: number, background: number, special: number) {
    Emit.send("highlight:set", [{id: 0, ui: true, hl: {
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
    highlights = highlights.map(([id, rgb, _, info]) => ({id, ui: info.pop()?.kind === "ui", hl: rgb }));
    Emit.send("highlight:set", highlights);
  }

  private hlGroupSet(hlgroup: any[]) {
    hlgroup = hlgroup.map(([name, id]) => ({id: +id, name}));
    Emit.send("highlight:name", hlgroup);
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
    const { width, height } = this.grids[grid].getSize();
    this.grids[grid] = new Grid(width, height);
    Emit.send(`clear:${grid}`);
  }

  private gridDestory(grid: number) {
    delete(this.grids[grid]);
    Emit.send("win:close", grid);
  }

  private gridCursorGoto(grid: number, row: number, col: number) {
    Object.keys(this.grids).forEach(i => {
      const args = +i == grid ? [row, col] : [ -1, -1 ];
      Emit.send(`cursor:${i}`, this.grids[+i].setCursorPos(args[0], args[1]));
    });

    if (this.grids[grid]) Emit.send("grid:cursor", this.grids[grid].getCursorPos());
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

  private winPos(grid: number, anchor: string, pgrid: number, row: number, col: number, width: number, height: number, focusable: boolean, zIndex: number) {
    if (this.grids[grid] && this.grids[pgrid]) {
      const current = this.grids[grid].getSize();
      width = width || current.width;
      height = height || current.height;

      const top = anchor[0] === "N" ? row : row - height;
      const left = anchor[1] === "W" ? col : col - width;

      this.grids[grid].setOffsetPos(top, left);
      Emit.send("win:pos", grid, width, height, top, left, focusable, zIndex);
    }
  }

  private winHide(grid: number) {
    Emit.send("win:hide", grid);
  }

  private winClose(grid: number) {
    Emit.send("win:close", grid);
  }

  private async tablineUpdate(current: Tabpage, tabs: { tab: Tabpage, name: string }[]) {
    const next: ITab[] = [];
    for (let i = 0; i < tabs.length; i++) {
      const { tab, name } = tabs[i];
      try {
        const buffer = await tab.window.buffer;
        const active = current.data === tab.data;
        const type = await current.request("nvim_buf_get_option", [buffer.data, "filetype"]);
        const edit = await current.request("nvim_buf_get_option", [buffer.data, "modified"]);
        const protect = !await current.request("nvim_buf_get_option", [buffer.data, "modifiable"]);

        next.push({ name, active, type, edit, protect });
      } catch(e) {
        Emit.share("envim:log", e);
      }
    }
    const qf = (await current.request("nvim_call_function", ["getqflist", [{size: 0}]])).size;
    const lc = (await current.request("nvim_call_function", ["getloclist", [0, {size: 0}]])).size;
    Emit.send("tabline:update", next, qf, lc);
  }

  private cmdlineShow(content: string[][], pos: number, prompt: string, indent: number) {
    Emit.send("cmdline:show", content, pos, prompt, indent);
  }

  private cmdlinePos(pos: number) {
    Emit.send("cmdline:cursor", pos);
  }

  private cmdlineSpecialChar(c: string, shift: boolean) {
    Emit.send("cmdline:special", c, shift);
  }

  private cmdlineHide() {
    Emit.send("cmdline:hide");
  }

  private cmdlineBlockShow(lines: string[][][]) {
    Emit.send("cmdline:blockshow", lines);
  }

  private cmdlineBlockAppend(line: string[][]) {
    Emit.send("cmdline:blockshow", [line]);
  }

  private cmdlineBlockHide() {
    Emit.send("cmdline:blockhide");
  }

  private popupmenuShow(items: string[][], selected: number, row: number, col: number, grid: number) {
    const height = Math.min(5, items.length);
    const offset = this.grids[grid]?.getOffsetPos() || { row: 1, col: this.grids[1].getSize().width * 0.1 + 3 };
    const parent = this.grids[1].getSize();

    row += offset.row;
    col += offset.col;

    row = row + height >= parent.height ? row - height : row + 1;
    col = Math.min(col, parent.width - 10);

    Emit.send("popupmenu:show", {
      items: items.map(([ word, kind, menu ]) => ({ word, kind, menu })),
      selected,
      start: 0,
      row,
      col,
    });
  }

  private popupmenuSelect(selected: number) {
    Emit.send("popupmenu:select", selected);
  }

  private popupmenuHide() {
    Emit.send("popupmenu:hide");
  }

  private msgShow(group: string, contents: any[]) {
    group === "history" && this.messages.clear(group);
    contents.forEach(([kind, messages, replace_last]) => {
      if (messages.length) {
        this.messages.set(group, kind, messages, replace_last);
      } else {
        this.messages.clear(group);
      }
    });

    Emit.send(`messages:${group}`, this.messages.get(group));
  }

  private mouse(mouse: boolean) {
    Emit.send("envim:mouse", mouse);
  }

  private busy(busy: boolean) {
    Object.values(this.grids).forEach(grid => grid.setBusy(busy));
  }

  private flush() {
    const timer = (new Date).getTime();
    this.timer = timer;
    setTimeout(() => {
      if (timer !== this.timer) return;
      Object.keys(this.grids).forEach(grid => {
        const flush = this.grids[+grid].getFlush();
        flush.length && Emit.send(`flush:${grid}`, flush);
      });
    });
  }
}
