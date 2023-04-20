import { Buffer as Buf } from "node:buffer";
import { NeovimClient } from "neovim";
import { Response } from "neovim/lib/host";
import { Tabpage, Buffer, Window } from "neovim/lib/api";

import { ITab, IBuffer, IMode, IMenu } from "common/interface";

import { Emit } from "../emit";
import { Function } from "./function";
import { Autocmd } from "./autocmd";
import { Clipboard } from "./clipboard";
import { Grids } from "./grid";
import { Highlights } from "./highlight";

export class App {
  private modes: IMode[] = [];

  constructor(private nvim: NeovimClient) {
    Emit.init();
    Highlights.init();
    Grids.init();
    Function.setup();
    Autocmd.setup();
    Clipboard.setup();
    nvim.on("request", this.onRequest);
    nvim.on("notification", this.onNotification);
    this.menu();
  }

  private onRequest = (method: string, args: any, res: Response) => {
    switch (method) {
      case "envim_clipboard": return Clipboard.paste(res);
    }
    console.log({ method, args });
  }

  private onNotification = (method: string, args: any) => {
    switch (method) {
      case "redraw" :return this.redraw(args);
      case "envim_clipboard": return Clipboard.copy(args[0], args[1]);
      case "envim_dirchanged": return Autocmd.dirchanged(args[0]);
      case "envim_setbackground": return args[0] && Emit.share("envim:theme", args[0]);
      case "envim_openurl": return args[0] && Emit.share("browser:open", -1, args[0]);
      case "envim_preview": return this.preview(args[0], args[1], args[2], args[3]);
    }
  }

  private preview = async (winid: number, media?: string, blob?: number[], ext?: string) => {
    const grid = Grids.getByWinId(winid);

    if (grid) {
      const { id } = grid.getInfo();
      const src: string[] = [];

      if (blob && ext) {
        if (["mov"].indexOf(ext) >= 0) ext = "quicktime"
        if (["wmv"].indexOf(ext) >= 0) ext = "x-ms-asf"
        if (["avi"].indexOf(ext) >= 0) ext = "x-msvideo"
        if (["svg"].indexOf(ext) >= 0) ext = "svg+xml"

        if (ext !== "svg") {
          await Emit.share("envim:command", "setlocal modifiable modified");
          await Emit.share("envim:api", "nvim_buf_set_lines", [0, 0, -1, true, [""]]);
          await Emit.share("envim:command", "setlocal nomodifiable nomodified");
        }

        const base64 = Buf.from(blob.map(c => String.fromCharCode(c)).join(""), "ascii").toString("base64");

        src.push(`data:${media}/${ext};base64,${base64}`)
      }
      Emit.send(`preview:${id}`, media, src.join(""));
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
          r.forEach(r => this.gridDestory(r[0]));
        break;
        case "grid_cursor_goto":
          r.forEach(r => this.gridCursorGoto(r[0], r[1], r[2]));
        break;
        case "grid_scroll":
          r.forEach(r => this.gridScroll(r[0], r[1], r[2], r[3], r[4], r[5], r[6]));
        break;

        /** ext_multigrid **/
        case "win_pos":
          r.forEach(r => this.winPos(r[0], r[1], r[2], r[3], r[4], r[5], true, 3, false));
        break;
        case "win_float_pos":
          r.forEach(r => this.winFloatPos(r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7]));
        break;
        case "msg_set_pos":
          r.forEach(r => this.msgSetPos(r[0], r[1]));
        break;
        case "win_hide":
          r.forEach(r => this.winHide(r[0]));
        break;
        case "win_close":
          r.forEach(r => this.winClose(r[0]));
        break;
        case "win_viewport":
          r.forEach(r => this.winViewport(r[0], r[2], r[3], r[6]));
        break;

        /** ext_tabline **/
        case "tabline_update":
          r.forEach(r => this.tablineUpdate(r[0], r[1], r[2], r[3]));
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
          this.cmdlineShow([], 0, "", 0);
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
          this.msgShow(r);
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
    Grids.get(grid).resize(width, height);
    Grids.setStatus(grid, "show", true);
  }

  private defaultColorsSet(foreground: number, background: number, special: number) {
    foreground = foreground >= 0 ? foreground : 0xffffff;
    background = background >= 0 ? background : 0x000000;
    special = special >= 0 ? special : foreground;

    Highlights.set("0", { foreground, background, special }, true);
    Grids.refresh();
    Emit.update("highlight:set", false, [{id: "0", ui: true, hl: { foreground, background, special }}]);
  }

  private hlAttrDefine(highlights: any[]) {
    highlights = highlights.map(([id, hl, _, info]) => {
      const ui = info.some((info: { kind: string }) => info.kind === "ui");

      return { id, ui, hl }
    }).filter(({ id, hl, ui }) => Highlights.set(id, hl, ui));
    Emit.update("highlight:set", false, highlights);
  }

  private gridLine(grid: number, row: number, col: number, cells: string[][]) {
    let i = 0;
    cells.forEach(cell => {
      const repeat = +cell[2] || 1;
      for (let j = 0; j < repeat; j++) {
        Grids.get(grid).setCell(row, col + i++, cell[0], cell.length > 1 ? cell[1] : "-1");
      }
    });
  }

  private gridClear(grid: number) {
    const { width, height } = Grids.get(grid).getInfo();

    Grids.get(grid).resize(width, height, true);
    Emit.send(`clear:${grid}`);
  }

  private gridDestory(grid: number) {
    Grids.setStatus(grid, "delete", false);
  }

  private gridCursorGoto(grid: number, row: number, col: number) {
    Grids.cursor(grid, row, col);
  }

  private gridScroll(grid: number, top: number, bottom: number, left: number, right: number, rows: number, cols: number) {
    Grids.get(grid).setScroll(top, bottom, left, right, rows, cols)
  }

  private winPos(grid: number, win: Window | null, row: number, col: number, width: number, height: number, focusable: boolean, zIndex: number, floating: boolean) {
    const winsize = Grids.get().getInfo();
    const current = Grids.get(grid);
    const winid = win ? win.id : 0;
    const overwidth = Math.max(0, col + width - winsize.width);
    const overheight = Math.max(0, row + height - winsize.height);

    col = Math.min(winsize.width - 1, Math.max(0, col - overwidth));
    row = Math.min(winsize.height - 1, Math.max(0, row - overheight));
    zIndex = grid === 1 ? 1 : zIndex;

    const update = current.setInfo({ winid, x: col, y: row, width, height, zIndex, focusable, floating });
    Grids.setStatus(grid, "show", update);

    if (winsize.width < width || winsize.height < height) {
      Emit.share("envim:resize", grid, Math.min(winsize.width - 2, width), Math.min(winsize.height - 2, height));
    }
  }

  private winFloatPos(grid: number, win: Window, anchor: string, pgrid: number, row: number, col: number, focusable: boolean, zIndex: number) {
    const current = Grids.get(grid).getInfo();
    const parent = Grids.get(pgrid).getInfo();

    row = parent.y + (anchor[0] === "N" ? row : row - current.height);
    col = parent.x + (anchor[1] === "W" ? col : col - current.width);

    this.winPos(grid, win, row, col, current.width, current.height, focusable, Math.max(zIndex, parent.zIndex + 4), true);
  }

  private msgSetPos(grid: number, row: number) {
    const winsize = Grids.get().getInfo();
    const width = winsize.width;
    const height = winsize.height - row;

    this.winPos(grid, null, row, 0, width, height, false, 50, true);
  }

  private winHide(grid: number) {
    Grids.setStatus(grid, "hide", false);
  }

  private winClose(grid: number) {
    Grids.setStatus(grid, "delete", false);
  }

  private winViewport(grid: number, top: number, bottom: number, total: number) {
    Grids.exist(grid) && Grids.get(grid).setViewport(top, bottom, total);
  }

  private async tablineUpdate(ctab: Tabpage, tabs: { tab: Tabpage, name: string }[], cbuf: Buffer, bufs: { buffer: Buffer, name: string }[]) {
    const next: { tabs: ITab[]; bufs: IBuffer[] } = { tabs: [], bufs: [] };

    for (let i = 0; i < tabs.length; i++) {
      const { tab, name } = tabs[i];
      const buffer = await tab.window.buffer.catch(() => null);

      if (buffer) {
        const active = ctab.data === tab.data;
        const filetype = await this.nvim.request("nvim_buf_get_option", [buffer.data, "filetype"]).catch(() => "");
        const buftype = await this.nvim.request("nvim_buf_get_option", [buffer.data, "buftype"]).catch(() => "");

        next.tabs.push({ name, active, filetype, buftype });
      }
    }

    for (let i = 0; i < bufs.length; i++) {
      const { buffer, name } = bufs[i];
      const active = cbuf.data === buffer.data;

      next.bufs.push({ name, buffer: +buffer.data, active });
    }

    Emit.update("tabline:update", true, next.tabs, next.bufs);
  }

  private cmdlineShow(content: string[][], pos: number, prompt: string, indent: number) {
    Emit.update("cmdline:show", true, content, pos, prompt, indent);
  }

  private cmdlinePos(pos: number) {
    Emit.update("cmdline:cursor", true, pos);
  }

  private cmdlineSpecialChar(c: string, shift: boolean) {
    Emit.send("cmdline:special", c, shift);
  }

  private cmdlineBlockShow(lines: string[][][]) {
    Emit.update("cmdline:blockshow", true, lines);
  }

  private cmdlineBlockAppend(line: string[][]) {
    Emit.update("cmdline:blockshow", true, [line]);
  }

  private cmdlineBlockHide() {
    Emit.update("cmdline:blockhide", true);
  }

  private popupmenuShow(items: string[][], selected: number, row: number, col: number, grid: number) {
    const parent = Grids.get().getInfo();
    const current = grid === -1 ? { y: 1, x: parent.width * 0.1 + 3, zIndex: 20 } : Grids.get(grid).getInfo();
    const [ x, y ] = [ col + current.x, row + current.y ];
    const height = Math.min(Math.max(y, parent.height - y - 1), items.length);
    const zIndex = current.zIndex + 1;

    row = y + height >= parent.height ? y - height : y + 1;
    col = Math.min(x, parent.width - 10);

    Emit.send("popupmenu:show", {
      items: items.map(([ word, kind, menu ]) => ({ word, kind, menu })),
      selected,
      start: 0,
      row,
      col,
      height,
      zIndex,
    });
  }

  private popupmenuSelect(selected: number) {
    Emit.send("popupmenu:select", selected);
  }

  private popupmenuHide() {
    Emit.send("popupmenu:hide");
  }

  private msgShow(messages: [string, [string, string][], boolean][]) {
    const replace = messages.some(message => message[2]);
    const entries = messages.map(message => this.convertMessage(message[0], message[1]));

    Emit.update("messages:show", false, entries, replace);
  }

  private msgClear() {
    Emit.update("messages:show", false, [], true);
  }

  private msgShowmode(contents: [string, string][]) {
    Emit.update("messages:mode", true, this.convertMessage("mode", contents));
  }

  private msgShowcmd(contents: [string, string][]) {
    Emit.update("messages:command", true, this.convertMessage("command", contents));
  }

  private msgRuler(contents: [string, string][]) {
    Emit.update("messages:ruler", true, this.convertMessage("ruler", contents));
  }

  private msgHistoryShow(entries: [string, [string, string][]][]) {
    if (entries.length) {
      this.nvim.command("messages clear");
      Emit.send("messages:history", entries.map(
        ([kind, contents]) => this.convertMessage(kind, contents)
      ));
    }
  }

  private convertMessage(kind: string, contents: [string, string][]) {
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
    Emit.update("mode:change", true, this.modes[index]);
  }

  private optionsSet(options: string[][]) {
    Emit.update("option:set", true, options.reduce((obj: { [k: string]: string }, [name, value]) => {
      obj[name] = value;
      return obj;
    }, {}));
  }

  private busy(busy: boolean) {
    Emit.update("grid:busy", true, busy);
  }

  private async menu() {
    const menus: IMenu[] = await this.nvim.call("menu_get", [""]);
    Emit.update("menu:update", true, menus.filter(({ name }) => !name.match(/^PopUp/)));
  }

  private flush() {
    Grids.flush();
  }
}
