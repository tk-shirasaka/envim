import { ipcMain, IpcMainEvent } from "electron";
import { createConnection } from "net";
import { spawn } from "child_process";
import { NeovimClient } from "neovim";
import { Response } from "neovim/lib/host";

import { Browser } from "./browser";
import { Clipboard } from "./clipboard";

export class Envim {
  private nvim = new NeovimClient;
  private attached: boolean = false;

  constructor() {
    ipcMain.on("envim:attach", this.onAttach.bind(this));
    ipcMain.on("envim:resize", this.onResize.bind(this));
    ipcMain.on("envim:mouse", this.onMouse.bind(this));
    ipcMain.on("envim:input", this.onInput.bind(this));
    ipcMain.on("envim:detach", this.onDetach.bind(this));
  }

  private async onAttach(_: IpcMainEvent, type: string, value: string) {
    let reader, writer;

    switch (type) {
      case "command":
        const proc = spawn(value, ["--embed"]);
        [reader, writer] = [proc.stdout, proc.stdin];
      break;
      case "address":
        const [port, host] = value.split(":").reverse();
        const socket = createConnection({ port: +port, host: host });
        [reader, writer] = [socket, socket];
      break;
    }

    if (reader && writer) {
      this.nvim.attach({ reader, writer });
      this.nvim.setClientInfo("Envim", { major: 0, minor: 0, patch: 1, prerelease: "dev" }, "ui", {}, {})
      this.nvim.on("request", this.onRequest.bind(this));
      this.nvim.on("notification", this.onNotification.bind(this));
      this.nvim.on("disconnect", this.onDisconnect.bind(this));
      Clipboard.setup(this.nvim);
      Browser.win?.webContents.send("app:start");
    }
  }

  private onRequest(method: string, args: any, res: Response) {
    switch (method) {
      case "envim_clipboard": return Clipboard.paste(res);
    }
    console.log({ method, args });
  }

  private onNotification(method: string, args: any) {
    switch (method) {
      case "redraw" :return Browser.win?.webContents.send("envim:redraw", args);
      case "envim_clipboard": return Clipboard.copy(args[0], args[1]);
    }
  }

  private async onResize(_: IpcMainEvent, width: number, height: number) {
    this.attached || await this.nvim.request("nvim_ui_attach", [width, height, { ext_linegrid: true, }]);
    await this.nvim.uiTryResize(width, height);
    this.attached = true;
  }

  private async onMouse(_: IpcMainEvent, button: string, action: string, row: number, col: number) {
    await this.nvim.inputMouse(button, action, "", 0, row, col);
  }

  private async onInput(_: IpcMainEvent, input: string) {
    await this.nvim.input(input);
  }

  private async onDetach() {
    await this.nvim.uiDetach();
    this.onDisconnect();
  }

  private onDisconnect() {
    this.attached = false;
    this.nvim = new NeovimClient;
    Browser.win?.webContents.send("app:stop");
  }
}
