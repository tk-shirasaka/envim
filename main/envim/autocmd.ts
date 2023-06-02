import { Emit } from "../emit";

export class Autocmd {
  static setup() {
    Emit.share("envim:luafile", "autocmd.lua");
  }

  static dirchanged(cwd: string) {
    Emit.send("envim:cwd", cwd);
  }
}
