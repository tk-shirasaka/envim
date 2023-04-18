import { Emit } from "../emit";

export class Autocmd {
  static setup() {
    Emit.share("envim:command", "augroup envim");
    Emit.share("envim:command", "  autocmd!");
    Emit.share("envim:command", "  autocmd BufRead,BufEnter *.png,*.jpe?g,*.gif,*.svg call EnvimConnect(0, 'envim_preview', win_getid(), blob2list(readblob(expand('%'))), expand('%:e'))");
    Emit.share("envim:command", "  autocmd BufHidden *.png,*.jpe?g,*.gif,*.svg call EnvimConnect(0, 'envim_preview', win_getid())");
    Emit.share("envim:command", "  autocmd DirChanged * call EnvimConnect(0, 'envim_dirchanged', getcwd())");
    Emit.share("envim:command", "  autocmd OptionSet background call EnvimConnect(0, 'envim_setbackground', &background)");
    Emit.share("envim:command", "augroup END");
  }

  static dirchanged(cwd: string) {
    Emit.send("envim:cwd", cwd);
  }
}
