import { Emit } from "../emit";

export class Function {
  static setup() {
    Emit.share("envim:command", [
      "function! EnvimConnect(sync, ...)",
      "  let fname = a:sync ? 'rpcrequest' : 'rpcnotify'",
      "  return call(fname, insert(a:000[0:], g:envim_id))",
      "endfunction",
    ].join("\n"));
  }
}
