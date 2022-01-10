import { Emit } from "../emit";

export class Autocmd {
  static setup(channel: number) {
    Emit.share("envim:command", `augroup envim`);
    Emit.share("envim:command", `  autocmd!`);
    Emit.share("envim:command", `  autocmd DirChanged * call rpcnotify(${channel}, "envim_dirchanged", getcwd())`);
    Emit.share("envim:command", `augroup END`);
  }

  static dirchanged(cwd: string) {
    Emit.send("envim:cwd", cwd);
  }
}
