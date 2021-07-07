import { dialog } from "electron";
import { createConnection, Socket } from "net";
import { spawn, ChildProcess } from "child_process";
import { NeovimClient } from "neovim";
import { UiAttachOptions } from "neovim/lib/api/Neovim"

import { Emit } from "./emit";
import { App } from "./envim/app";

export class Envim {
  private nvim = new NeovimClient;
  private connect: { process?: ChildProcess; socket?: Socket; } = {}

  constructor() {
    Emit.on("envim:connect", this.onConnect.bind(this));
    Emit.on("envim:attach", this.onAttach.bind(this));
    Emit.on("envim:resize", this.onResize.bind(this));
    Emit.on("envim:api", this.onApi.bind(this));
    Emit.on("envim:mouse", this.onMouse.bind(this));
    Emit.on("envim:input", this.onInput.bind(this));
    Emit.on("envim:command", this.onCommand.bind(this));
    process.on("uncaughtException", this.onError.bind(this));
    process.on("unhandledRejection", this.onError.bind(this));
  }

  private async onConnect(type: string, value: string ) {
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
      this.nvim.on("disconnect", this.onDisconnect.bind(this));
      new App(this.nvim);
      Emit.send("app:start");
    }
  }

  private onAttach(width: number, height: number, options: UiAttachOptions) {
    this.nvim.uiAttach(width, height, { ...{ ext_linegrid: true }, ...options });
  }

  private onResize(grid: number, width: number, height: number) {
    this.nvim.uiTryResizeGrid(grid, width, height)
  }

  private async onApi(fname: string, args: any[]) {
    await this.nvim.request(fname, args);
  }

  private async onMouse(grid: number, button: string, action: string, modifier: string, row: number, col: number) {
    await this.nvim.inputMouse(button, action, modifier, grid, row, col);
  }

  private async onInput(input: string) {
    await this.nvim.input(input);
  }

  private async onCommand(command: string) {
    await this.nvim.command(command);
  }

  private onDisconnect() {
    Emit.send("app:stop");
  }

  private onError(e: Error | any) {
    if (e instanceof Error) {
      dialog.showErrorBox('Error', `${e.message}\n${e.stack || ""}`);
    } else if (e instanceof String) {
      dialog.showErrorBox('Error', e.toString());
    }
    this.onDisconnect();
  }
}
