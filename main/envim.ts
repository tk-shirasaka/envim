import { ipcMain, IpcMainEvent } from "electron";
import { spawn } from "child_process";
import { attach, NeovimClient } from "neovim";

import { Browser } from "./browser";

export class Envim {
  private nvim?: NeovimClient;

  constructor() {
    ipcMain.on("envim:attach", this.onAttach.bind(this));
    ipcMain.on("envim:resize", this.onResize.bind(this));
    ipcMain.on("envim:mouse", this.onMouse.bind(this));
    ipcMain.on("envim:input", this.onInput.bind(this));
    ipcMain.on("envim:copy", this.onCopy.bind(this));
    ipcMain.on("envim:paste", this.onPaste.bind(this));
    ipcMain.on("envim:detach", this.onDetach.bind(this));
  }

  private async onAttach(_: IpcMainEvent, type: string, value: string) {
    switch (type) {
      case "cmd":
        const proc = spawn(value, ["--embed"]);
        this.nvim = attach({proc: proc});
      break;
      case "port":
        this.nvim = attach({socket: value});
      break;
    }
    if (this.nvim) {
      await this.nvim.uiAttach(10, 10, {})

      this.nvim.on("notification", this.onNotification.bind(this));
      this.nvim.on("disconnect", this.onDisconnect.bind(this));
      Browser.win?.webContents.send("app:start");
    }
  }

  private onNotification(method: string, args: any) {
    if (method === "redraw") {
      Browser.win?.webContents.send("envim:redraw", args);
    }
  }

  private async onResize(_: IpcMainEvent, width: number, height: number) {
    await this.nvim?.uiTryResize(width, height);
  }

  private async onMouse(_: IpcMainEvent, button: string, action: string, row: number, col: number) {
    await this.nvim?.inputMouse(button, action, "", 0, row, col);
  }

  private async onInput(_: IpcMainEvent, input: string) {
    await this.nvim?.input(input);
  }

  private async onCopy() {
    const data = await this.nvim?.commandOutput("echo @");
    data && Browser.win?.webContents.send("envim:clipboard", data);
  }

  private async onPaste(_: IpcMainEvent, data: string) {
    await this.nvim?.request("nvim_paste", [data, true, -1]);
  }

  private async onDetach() {
    await this.nvim?.uiDetach();
    this.onDisconnect();
  }

  private onDisconnect() {
    delete(this.nvim);
    Browser.win?.webContents.send("app:stop");
  }
}
