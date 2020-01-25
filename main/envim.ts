import { ipcMain, IpcMainEvent } from "electron";
import { createConnection, Socket } from "net";
import { spawn, ChildProcess } from "child_process";
import { NeovimClient } from "neovim";
import { Response } from "neovim/lib/host";

import { Browser } from "./browser";
import { App } from "./envim/app";
import { Clipboard } from "./envim/clipboard";

export class Envim {
  private nvim = new NeovimClient;
  private app = new App;
  private attached: boolean = false;
  private connect: { process?: ChildProcess; socket?: Socket; } = {}

  constructor() {
    ipcMain.on("envim:attach", this.onAttach.bind(this));
    ipcMain.on("envim:resize", this.onResize.bind(this));
    ipcMain.on("envim:mouse", this.onMouse.bind(this));
    ipcMain.on("envim:input", this.onInput.bind(this));
    ipcMain.on("envim:tab", this.onTab.bind(this));
    ipcMain.on("envim:log", this.onLog.bind(this));
    ipcMain.on("envim:detach", this.onDetach.bind(this));
  }

  private async onAttach(_: IpcMainEvent, type: string, value: string) {
    let reader, writer;

    switch (type) {
      case "command":
        this.connect.process = spawn(value, ["--embed"]);
        [reader, writer] = [this.connect.process.stdout, this.connect.process.stdin];
      break;
      case "address":
        const [port, host] = value.split(":").reverse();
        this.connect.socket = createConnection({ port: +port, host: host });
        [reader, writer] = [this.connect.socket, this.connect.socket];
      break;
    }

    if (reader && writer) {
      this.nvim = new NeovimClient;
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
      case "redraw" :return this.app.redraw(args);
      case "envim_clipboard": return Clipboard.copy(args[0], args[1]);
    }
  }

  private async onResize(_: IpcMainEvent, width: number, height: number) {
    const options = {
      ext_linegrid: true,
      ext_tabline: true,
      ext_cmdline: true,
      ext_popupmenu: true,
      ext_messages: true,
    };
    this.attached || await this.nvim.request("nvim_ui_attach", [width, height, options]);
    await this.nvim.uiTryResize(width, height);
    this.attached = true;
  }

  private async onMouse(_: IpcMainEvent, button: string, action: string, row: number, col: number) {
    await this.nvim.inputMouse(button, action, "", 0, row, col);
  }

  private async onInput(_: IpcMainEvent, input: string) {
    await this.nvim.input(input);
  }

  private async onTab(_: IpcMainEvent, no: number) {
    await this.nvim.command(`tabnext ${no}`);
  }

  private async onLog(_: IpcMainEvent, log: any) {
    if (["number", "string"].indexOf(typeof log) < 0) {
      log = JSON.stringify(log);
    }
    this.nvim.outWriteLine(log);
  }

  private async onDetach() {
    await this.nvim.uiDetach();
    this.connect.process?.kill();
    this.connect.socket?.end("");
    this.connect = {};
  }

  private onDisconnect() {
    this.attached = false;
    Browser.win?.webContents.send("app:stop");
  }
}
