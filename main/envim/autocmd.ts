import { Emit } from "../emit";

export class Autocmd {
  static setup() {
    Emit.share("envim:command", "augroup envim");
    Emit.share("envim:command", "  autocmd!");
    Emit.share("envim:command", "  autocmd BufRead,BufEnter,BufWritePost *.ico,*.png,*.jpg,*.jpeg,*.gif,*.svg call EnvimConnect(0, 'envim_preview', win_getid(), 'image', blob2list(readblob(expand('%'))), expand('%:e'))");
    Emit.share("envim:command", "  autocmd BufRead,BufEnter,BufWritePost *.mp4,*.webm call EnvimConnect(0, 'envim_preview', win_getid(), 'video', blob2list(readblob(expand('%'))), expand('%:e'))");
    Emit.share("envim:command", "  autocmd BufRead,BufEnter,BufWritePost *.pdf call EnvimConnect(0, 'envim_preview', win_getid(), 'application', blob2list(readblob(expand('%'))), expand('%:e'))");
    Emit.share("envim:command", "  autocmd BufHidden,BufDelete *.ico,*.png,*.jpg,*.jpeg,*.gif,*.svg,*.mp4*,.webm,*.pdf call EnvimConnect(0, 'envim_preview', win_getid())");
    Emit.share("envim:command", "  autocmd DirChanged * call EnvimConnect(0, 'envim_dirchanged', getcwd())");
    Emit.share("envim:command", "  autocmd OptionSet background call EnvimConnect(0, 'envim_setbackground', &background)");
    Emit.share("envim:command", "augroup END");
  }

  static dirchanged(cwd: string) {
    Emit.send("envim:cwd", cwd);
  }
}
