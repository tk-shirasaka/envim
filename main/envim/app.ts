import { NeovimClient } from "neovim";
import { Response } from "neovim/lib/host";
import { Tabpage } from "neovim/lib/api/Tabpage";

import { ITab, IMode } from "common/interface";

import { Emit } from "../emit";
import { Clipboard } from "./clipboard";
import { Grid } from "./grid";
import { Messages } from "./messages";

export class App {
  private grids: { [k: number]: Grid } = {};
  private messages: Messages = new Messages;
  private modes: IMode[] = [];
  private timer: number = 0;

  constructor(private nvim: NeovimClient) {
    Clipboard.setup(this.nvim);
    nvim.on("request", this.onRequest.bind(this));
    nvim.on("notification", this.onNotification.bind(this));
    this.menu();
  }

  private onRequest(method: string, args: any, res: Response) {
    switch (method) {
      case "envim_clipboard": return Clipboard.paste(res);
    }
    console.log({ method, args });
  }

  private onNotification(method: string, args: any) {
    switch (method) {
      case "redraw" :return this.redraw(args);
      case "envim_clipboard": return Clipboard.copy(args[0], args[1]);
    }
  }

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

        /** ext_multigrid **/
        case "win_pos":
          r.forEach(r => this.winPos(r[0], r[2], r[3], r[4], r[5], true, 1));
        break;
        case "win_float_pos":
          r.forEach(r => this.winFloatPos(r[0], r[2], r[3], r[4], r[5], r[6]));
        break;
        case "msg_set_pos":
          r.forEach(r => this.msgSetPos(r[0], r[1]));
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
          this.msgHistoryShow(r[0][0]);
        break;

        /** default **/
        case "mode_info_set":
          this.modeInfoSet(r[0][1]);
        break;
        case "mode_change":
          this.modeChange(r[0][1]);
        break;
        case "busy_start":
          this.busy(true);
        break;
        case "busy_stop":
          this.busy(false);
        break;
        case "update_menu":
          this.menu();
        break;
        case "flush":
          this.flush();
        break;
      }
    });
  }

  private gridResize(grid: number, width: number, height: number) {
    let refresh = false;

    if (this.grids[grid]) {
      refresh = this.grids[grid].resize(width, height);
    } else {
      refresh = true;
      this.grids[grid] = new Grid(width, height);
    }

    if (refresh) {
      const { zIndex, offset, focusable } = this.grids[grid].getInfo();
      this.winPos(grid, offset.row, offset.col, width, height, focusable, zIndex);
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
    const { width, height } = this.grids[grid].getInfo();
    this.grids[grid] = new Grid(width, height);
    Emit.send(`clear:${grid}`);
  }

  private gridDestory(grid: number) {
    delete(this.grids[grid]);
    Emit.send("win:close", grid);
  }

  private gridCursorGoto(grid: number, row: number, col: number) {
    if (this.grids[grid]) Emit.send("grid:cursor", this.grids[grid].getCursorPos(row, col));
  }

  private gridScroll(grid: number, top: number, bottom: number, left: number, right: number, rows: number, cols: number) {
    this.grids[grid].scroll(top, bottom, left, right, rows, cols)
  }

  private winPos(grid: number, row: number, col: number, width: number, height: number, focusable: boolean, zIndex: number) {
    if (!this.grids[grid]) this.grids[grid] = new Grid(width, height);

    this.grids[grid].setInfo(width, height, zIndex, { row, col }, focusable);
    Emit.send("win:pos", grid, width, height, row, col, focusable, zIndex);
  }

  private winFloatPos(grid: number, anchor: string, pgrid: number, row: number, col: number, focusable: boolean) {
    const winsize = this.grids[1].getInfo();
    const current = this.grids[grid] ? this.grids[grid].getInfo() : this.grids[1].getInfo();
    const { offset, zIndex } = this.grids[pgrid].getInfo();

    row = Math.min(winsize.height - 1, Math.max(0, offset.row + (anchor[0] === "N" ? row : row - current.height)));
    col = Math.min(winsize.width - 1, Math.max(0, offset.col + (anchor[1] === "W" ? col : col - current.width)));

    const width = current.width - Math.max(0, col + current.width - winsize.width);
    const height = current.height - Math.max(0, row + current.height - winsize.height);

    this.winPos(grid, row, col, width, height, focusable, zIndex + 5);

    if (current.width < width || current.height < height) {
      Emit.share("envim:resize", grid, width, height);
    }
  }

  private msgSetPos(grid: number, row: number) {
    const winsize = this.grids[1].getInfo();
    const width = winsize.width;
    const height = winsize.height - row;

    this.winPos(grid, row, 0, width, height, false, winsize.zIndex + 3);
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
      const buffer = await tab.window.buffer.catch(() => null);

      if (buffer) {
        const active = current.data === tab.data;
        const filetype = await this.nvim.request("nvim_buf_get_option", [buffer.data, "filetype"]);
        const buftype = await this.nvim.request("nvim_buf_get_option", [buffer.data, "buftype"]);

        next.push({ name, active, filetype, buftype });
      }
    }
    Emit.send("tabline:update", next);
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
    const offset = this.grids[grid]?.getInfo().offset || { row: 1, col: this.grids[1].getInfo().width * 0.1 + 3 };
    const parent = this.grids[1].getInfo();

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

  private msgHistoryShow(contents: any[]) {
    this.messages.clear("history");
    contents.forEach(([kind, messages, replace_last]) => (this.messages.set("history", kind, messages, replace_last)));

    if (contents.length) {
      this.nvim.command("messages clear");
      Emit.send("messages:history", this.messages.get("history"));
    }
  }

  private modeInfoSet(modes: IMode[]) {
    this.modes = modes;
  }

  private modeChange(index: number) {
    Emit.send("mode:change", this.modes[index]);
  }

  private busy(busy: boolean) {
    Emit.send("grid:busy", busy);
  }

  private async menu() {
    const menus = await this.nvim.call("menu_get", [""]);
    Emit.send("menu:update", menus);
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
