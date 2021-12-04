import { NeovimClient } from "neovim";

import { Emit } from "../emit";

export class Autocmd {
  static async setup(nvim: NeovimClient) {
    const channelId = await nvim.channelId;
    nvim.command(`augroup envim`)
    nvim.command(`  autocmd!`)
    nvim.command(`  autocmd DirChanged * call rpcnotify(${channelId}, "envim_dirchanged", getcwd())`)
    nvim.command(`augroup END`)
  }

  static dirchanged(cwd: string) {
    Emit.send("envim:cwd", cwd);
  }
}
