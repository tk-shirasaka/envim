import { dialog, clipboard } from "electron";
import { Response } from "neovim/lib/host";

import { Emit } from "../emit";

export class Clipboard {
  private static lines: string[];
  private static type: "v" | "V" | "b";

  static setup(channel: number) {
    Emit.share("envim:command", [
      `let g:clipboard = {`,
      `  "name": "envim",`,
      `  "copy": {`,
      `     "+": {lines, regtype -> rpcnotify(${channel}, "envim_clipboard", lines, regtype)},`,
      `     "*": {lines, regtype -> rpcnotify(${channel}, "envim_clipboard", lines, regtype)},`,
      `   },`,
      `  "paste": {`,
      `     "+": {-> rpcrequest(${channel}, "envim_clipboard")},`,
      `     "*": {-> rpcrequest(${channel}, "envim_clipboard")},`,
      `  },`,
      `}`,
    ].join(""));
    Emit.share("envim:command", "unlet! g:loaded_clipboard_provider");
    Emit.share("envim:command", "runtime autoload/provider/clipboard.vim");
  }

  static copy(lines: string[], type: "v" | "V" | "b") {
    Clipboard.lines = lines;
    Clipboard.type = type
    clipboard.writeText(lines.join("\n"));

    const options = { message: "Open a url?", buttons: ["Yes", "no"], defaultId: 0 };
    if (lines[0].search(/^https?:\/\/\w+/) === 0 && dialog.showMessageBoxSync(options) === 0) {
      Emit.share("browser:url", lines[0])
    }
  }

  static paste(res: Response) {
    const text = clipboard.readText();
    const lines = text.split("\n");
    if (Clipboard.lines && Clipboard.lines.join("\n") === text) {
      res.send([Clipboard.lines, Clipboard.type]);
    } else {
      res.send([lines, lines.length > 1 ? "V" : "v"]);
    }
  }
}
