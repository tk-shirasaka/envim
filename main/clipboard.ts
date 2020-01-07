import { clipboard } from "electron";
import { NeovimClient } from "neovim";
import { Response } from "neovim/lib/host";

export class Clipboard {
  private static lines: string[];
  private static type: "v" | "V" | "b";

  static async setup(nvim: NeovimClient) {
    const channelId = await nvim.channelId;
    nvim.command([
      `let g:clipboard = {`,
        `  "name": "envim",`,
      `  "copy": {`,
        `     "+": {lines, regtype -> rpcnotify(${channelId}, "envim_clipboard", lines, regtype)},`,
        `     "*": {lines, regtype -> rpcnotify(${channelId}, "envim_clipboard", lines, regtype)},`,
        `   },`,
        `  "paste": {`,
          `     "+": {-> rpcrequest(${channelId}, "envim_clipboard")},`,
          `     "*": {-> rpcrequest(${channelId}, "envim_clipboard")},`,
          `  },`,
          `}`,
    ].join(""));
    nvim.command("unlet g:loaded_clipboard_provider")
    nvim.command("runtime autoload/provider/clipboard.vim")
  }

  static copy(lines: string[], type: "v" | "V" | "b") {
    Clipboard.lines = lines;
    Clipboard.type = type
    clipboard.writeText(lines.join("\n"));
  }

  static paste(res: Response) {
    const text = clipboard.readText();
    const lines = text.split("\n");
    if (Clipboard.lines.join("\n") === text) {
      res.send([Clipboard.lines, Clipboard.type]);
    } else {
      res.send([lines, lines.length > 1 ? "V" : "v"]);
    }
  }
}
