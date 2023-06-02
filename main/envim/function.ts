import { Emit } from "../emit";

export class Function {
  static setup() {
    Emit.share("envim:luafile", "function.lua");
  }
}
