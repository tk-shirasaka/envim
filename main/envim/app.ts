import { NeovimClient } from "neovim";
import { Response } from "neovim/lib/host";
import { Tabpage } from "neovim/lib/api/Tabpage";

import { ITab, IMode } from "common/interface";

import { Emit } from "../emit";
import { Clipboard } from "./clipboard";
import { Grids } from "./grid";

export class App {
  private modes: IMode[] = [];
  private options: { [k: string]: string | number | boolean} = {};

  constructor(private nvim: NeovimClient) {
    Grids.init();
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
          r.forEach(r => this.gridResize(r[0], r[1], r[2]));
        break;
        case "default_colors_set":
          r.forEach(r => this.defaultColorsSet(r[0], r[1], r[2]));
        break;
        case "hl_attr_define":
          this.hlAttrDefine(r);
        break;
        case "grid_line":
          r.forEach(r => this.gridLine(r[0], r[1], r[2], r[3]));
        break;
        case "grid_clear":
          r.forEach(r => this.gridClear(r[0]));
        break;
        case "grid_destroy":
          this.gridDestory(r.reduce((prev: number[], curr: number[]) => [ ...curr, ...prev]));
        break;
        case "grid_cursor_goto":
          r.forEach(r => this.gridCursorGoto(r[0], r[1], r[2]));
        break;
        case "grid_scroll":
          r.forEach(r => this.gridScroll(r[0], r[1], r[2], r[3], r[4], r[5], r[6]));
        break;

        /** ext_multigrid **/
        case "win_pos":
          r.forEach(r => this.winPos(r[0], r[2], r[3], r[4], r[5], true, 3));
        break;
        case "win_float_pos":
          r.forEach(r => this.winFloatPos(r[0], r[2], r[3], r[4], r[5], r[6]));
        break;
        case "msg_set_pos":
          r.forEach(r => this.msgSetPos(r[0], r[1]));
        break;
        case "win_hide":
          this.winHide(r.reduce((prev: number[], curr: number[]) => [ ...curr, ...prev]));
        break;
        case "win_close":
          this.winClose(r.reduce((prev: number[], curr: number[]) => [ ...curr, ...prev]));
        break;

        /** ext_tabline **/
        case "tabline_update":
          r.forEach(r => this.tablineUpdate(r[0], r[1]));
        break;

        /** ext_cmdline **/
        case "cmdline_show":
          r.forEach(r => this.cmdlineShow(r[0], r[1], r[2] || r[3], r[4]));
        break;
        case "cmdline_pos":
          r.forEach(r => this.cmdlinePos(r[0]));
        break;
        case "cmdline_special_char":
          r.forEach(r => this.cmdlineSpecialChar(r[0], r[1]));
        break;
        case "cmdline_hide":
          this.cmdlineHide();
        break;
        case "cmdline_block_show":
          r.forEach(r => this.cmdlineBlockShow(r[0]));
        break;
        case "cmdline_block_append":
          r.forEach(r => this.cmdlineBlockAppend(r[0]));
        break;
        case "cmdline_block_hide":
          this.cmdlineBlockHide();
        break;

        /** ext_popupmenu **/
        case "popupmenu_show":
          r.forEach(r => this.popupmenuShow(r[0], r[1], r[2], r[3], r[4]));
        break;
        case "popupmenu_select":
          r.forEach(r => this.popupmenuSelect(r[0]));
        break;
        case "popupmenu_hide":
          this.popupmenuHide();
        break;

        /** ext_messages **/
        case "msg_show":
          r.forEach(r => this.msgShow(r[0], r[1], r[2]));
        break;
        case "msg_showmode":
          r.forEach(r => this.msgShowmode(r[0]));
        break;
        case "msg_showcmd":
          r.forEach(r => this.msgShowcmd(r[0]));
        break;
        case "msg_ruler":
          r.forEach(r => this.msgRuler(r[0]));
        break;
        case "msg_clear":
          this.msgClear();
        break;
        case "msg_history_show":
          this.msgHistoryShow(r[0][0]);
        break;

        /** default **/
        case "mode_info_set":
          r.forEach(r => this.modeInfoSet(r[1]));
        break;
        case "mode_change":
          r.forEach(r => this.modeChange(r[1]));
        case "option_set":
          this.optionsSet(r);
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
    Grids.get(grid).resize(width, height) && Grids.show(grid);
  }

  private async defaultColorsSet(foreground: number, background: number, special: number) {
    Emit.send("highlight:set", [{id: "0", ui: true, hl: { foreground, background, special }}]);

    const black = await this.nvim.getColorByName("black");
    const white = await this.nvim.getColorByName("white");
    const blue = await this.nvim.getColorByName("blue1");
    const lightblue = await this.nvim.getColorByName("steelblue2");
    const green = await this.nvim.getColorByName("springgreen1");
    const yellow = await this.nvim.getColorByName("yellow1");
    const orange = await this.nvim.getColorByName("orange1");
    const red = await this.nvim.getColorByName("firebrick1");
    const pink = await this.nvim.getColorByName("deeppink1");
    const purple = await this.nvim.getColorByName("purple1");

    Emit.send("highlight:set", [
      {id: "-1", ui: true, hl: { foreground: white, background: black, special: red }},
      {id: "blue", ui: true, hl: { foreground: blue }},
      {id: "lightblue", ui: true, hl: { foreground: lightblue }},
      {id: "green", ui: true, hl: { foreground: green }},
      {id: "yellow", ui: true, hl: { foreground: yellow }},
      {id: "orange", ui: true, hl: { foreground: orange }},
      {id: "red", ui: true, hl: { foreground: red }},
      {id: "pink", ui: true, hl: { foreground: pink }},
      {id: "purple", ui: true, hl: { foreground: purple }},
    ]);
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
        Grids.get(grid).setCell(row, col + i++, cell[0], cell.length > 1 ? cell[1] : "-1");
      }
    });
  }

  private gridClear(grid: number) {
    const { width, height, zIndex, offset, focusable } = Grids.get(grid).getInfo();

    Grids.delete(grid);
    Grids.get(grid).setInfo(width, height, zIndex, offset, focusable);
    Emit.send(`clear:${grid}`);
  }

  private gridDestory(grids: number[]) {
    grids.forEach(grid => Grids.delete(grid));
    Emit.send("win:close", grids);
  }

  private gridCursorGoto(grid: number, row: number, col: number) {
    Grids.cursor(grid, row, col);
  }

  private gridScroll(grid: number, top: number, bottom: number, left: number, right: number, rows: number, cols: number) {
    const [ cells, scroll ] = Grids.get(grid).scroll(top, bottom, left, right, rows, cols)
    Emit.send(`flush:${grid}`, cells, scroll);
  }

  private winPos(grid: number, row: number, col: number, width: number, height: number, focusable: boolean, zIndex: number) {
    const winsize = Grids.get().getInfo();
    const current = Grids.get(grid);
    const overwidth = Math.max(0, col + width - winsize.width);
    const overheight = Math.max(0, row + height - winsize.height);

    col = Math.min(winsize.width - 1, Math.max(0, col - overwidth));
    row = Math.min(winsize.height - 1, Math.max(0, row - overheight));

    current.setInfo(width, height, grid === 1 ? 1 : zIndex, { row, col }, focusable);
    Grids.show(grid);

    if (winsize.width < width || winsize.height < height) {
      Emit.share("envim:resize", grid, Math.min(winsize.width, width), Math.min(winsize.height, height));
    }
  }

  private winFloatPos(grid: number, anchor: string, pgrid: number, row: number, col: number, focusable: boolean) {
    const current = Grids.get(grid).getInfo();
    const { offset, zIndex } = Grids.get(pgrid).getInfo();

    row = offset.row + (anchor[0] === "N" ? row : row - current.height);
    col = offset.col + (anchor[1] === "W" ? col : col - current.width);

    this.winPos(grid, row, col, current.width, current.height, focusable, zIndex + 4);
  }

  private msgSetPos(grid: number, row: number) {
    const winsize = Grids.get().getInfo();
    const width = winsize.width;
    const height = winsize.height - row;

    this.winPos(grid, row, 0, width, height, false, winsize.zIndex + 3);
  }

  private winHide(grids: number[]) {
    Grids.hide(grids);
  }

  private winClose(grids: number[]) {
    Emit.send("win:close", grids);
  }

  private async tablineUpdate(current: Tabpage, tabs: { tab: Tabpage, name: string }[]) {
    const next: ITab[] = [];
    for (let i = 0; i < tabs.length; i++) {
      const { tab, name } = tabs[i];
      const buffer = await tab.window.buffer.catch(() => null);

      if (buffer) {
        const active = current.data === tab.data;
        const filetype = await this.nvim.request("nvim_buf_get_option", [buffer.data, "filetype"]).catch(() => "");
        const buftype = await this.nvim.request("nvim_buf_get_option", [buffer.data, "buftype"]).catch(() => "");

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
    const offset = Grids.exist(grid) ? Grids.get(grid).getInfo().offset : { row: 1, col: Grids.get().getInfo().width * 0.1 + 3 };
    const parent = Grids.get().getInfo();

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

  private msgShow(kind: string, contents: string[][], replace: boolean) {
    Emit.send("messages:show", this.convertMessage(kind, contents), replace);
  }

  private msgClear() {
    Emit.send("messages:clear");
  }

  private msgShowmode(contents: string[][]) {
    Emit.send("messages:mode", this.convertMessage("mode", contents));
  }

  private msgShowcmd(contents: string[][]) {
    Emit.send("messages:command", this.convertMessage("command", contents));
  }

  private msgRuler(contents: string[][]) {
    Emit.send("messages:ruler", this.convertMessage("ruler", contents));
  }

  private msgHistoryShow(entries: any[]) {
    if (entries.length) {
      this.nvim.command("messages clear");
      Emit.send("messages:history", entries.map(
        ([kind, contents]) => this.convertMessage(kind, contents)
      ));
    }
  }

  private convertMessage(kind: string, contents: string[][]) {
    return {
      kind,
      contents: contents
        .map(([hl, content], i) => ({ hl, content: i ? content : content.replace(/^\s*\n/, "") }))
        .filter(({ content }) => content.length)
    };
  }

  private modeInfoSet(modes: IMode[]) {
    this.modes = modes;
  }

  private modeChange(index: number) {
    Emit.send("mode:change", this.modes[index]);
  }

  private optionsSet(options: string[][]) {
    const diff = options.filter(([name, value]) => {
      const result = this.options[name] !== value;
      this.options[name] = value;

      return result;
    }).length > 0;

    diff && Emit.send("option:set", this.options);
  }

  private busy(busy: boolean) {
    Emit.send("grid:busy", busy);
  }

  private async menu() {
    const menus = await this.nvim.call("menu_get", [""]);
    Emit.send("menu:update", menus);
  }

  private flush() {
    Grids.all((id, grid) => {
      const cells = grid.getFlush();
      cells.length && Emit.send(`flush:${id}`, cells);
    });
  }
}
