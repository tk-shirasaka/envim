import { dialog } from "electron";
import { createConnection, Socket } from "net";
import { spawn, ChildProcess } from "child_process";
import { NeovimClient } from "neovim";
import { Response } from "neovim/lib/host";

import { Emit } from "./emit";
import { App } from "./envim/app";
import { Clipboard } from "./envim/clipboard";

export class Envim {
  private nvim = new NeovimClient;
  private app = new App;
  private state: { attached: boolean; width: number; height: number, options: { [k: string]: boolean } } = { attached: false, width: 0, height: 0, options: {} };
  private connect: { process?: ChildProcess; socket?: Socket; } = {}

  constructor() {
    Emit.on("envim:attach", this.onAttach.bind(this));
    Emit.on("envim:resize", this.onResize.bind(this));
    Emit.on("envim:mouse", this.onMouse.bind(this));
    Emit.on("envim:input", this.onInput.bind(this));
    Emit.on("envim:command", this.onCommand.bind(this));
    Emit.on("envim:log", this.onLog.bind(this));
    Emit.on("envim:detach", this.onDetach.bind(this));
    process.on("uncaughtException", this.onError.bind(this));
    process.on("unhandledRejection", this.onError.bind(this));
  }

  private async onAttach(type: string, value: string, options: { [k: string]: boolean }) {
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
      this.state.options = options;
      this.app = new App;
      this.nvim = new NeovimClient;
      this.nvim.attach({ reader, writer });
      this.nvim.setClientInfo("Envim", { major: 0, minor: 0, patch: 1, prerelease: "dev" }, "ui", {}, {})
      this.nvim.on("request", this.onRequest.bind(this));
      this.nvim.on("notification", this.onNotification.bind(this));
      this.nvim.on("disconnect", this.onDisconnect.bind(this));
      Clipboard.setup(this.nvim);
      Emit.send("app:start");
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

  private onResize(grid: number, width: number, height: number) {
    const options: { [k: string]: boolean } = { ...{ ext_linegrid: true }, ...this.state.options };

    if (!this.state.attached) {
      this.nvim.request("nvim_ui_attach", [width, height, options]);
    } else if (this.state.width !== width || this.state.height !== height) {
      options.ext_multigrid
        ? this.nvim.uiTryResizeGrid(grid, width, height)
        : this.nvim.uiTryResize(width, height);
    }
    this.state = { attached: true, width, height, options };
  }

  private async onMouse(grid: number, button: string, action: string, row: number, col: number) {
    await this.nvim.inputMouse(button, action, "", grid, row, col);
  }

  private async onInput(input: string) {
    await this.nvim.input(input);
  }

  private async onCommand(command: string) {
    await this.nvim.command(command);
  }

  private async onLog(log: any) {
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
    this.state.attached = false;
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
