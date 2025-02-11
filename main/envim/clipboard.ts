import { clipboard } from "electron";
import { Response } from "neovim/lib/host";

import { Emit } from "../emit";

export class Clipboard {
  private static lines: string[];
  private static type: "v" | "V" | "b";

  static setup() {
    Emit.share("envim:luafile", "clipboard.lua");
  }

  static copy(lines: string[], type: "v" | "V" | "b") {
    Clipboard.lines = lines;
    Clipboard.type = type
    clipboard.writeText(lines.join("\n"));
  }

  static paste(res: Response) {
    const image = clipboard.availableFormats().find(f => f.startsWith("image/"));

    if (image) {
      Emit.share("envim:preview", clipboard.readImage().toPNG(), "png");
      res.send([[""], "v"]);
    } else {
      const text = clipboard.readText();
      const lines = text.split("\n");
      if (Clipboard.lines && Clipboard.lines.join("\n") === text) {
        res.send([Clipboard.lines, Clipboard.type]);
      } else {
        res.send([lines, lines.length > 1 ? "V" : "v"]);
      }
    }
  }
}
