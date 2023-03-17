import { dialog, nativeTheme } from "electron";
import { createConnection, Socket } from "net";
import { spawn, ChildProcess } from "child_process";
import { NeovimClient } from "neovim";
import { UiAttachOptions } from "neovim/lib/api/Neovim"

import { Emit } from "./emit";
import { App } from "./envim/app";
import { Grids } from "./envim/grid";

export class Envim {
  private nvim = new NeovimClient;
  private connect: { process?: ChildProcess; socket?: Socket; } = {}

  constructor() {
    Emit.on("envim:connect", this.onConnect);
    Emit.on("envim:attach", this.onAttach);
    Emit.on("envim:resize", this.onResize);
    Emit.on("envim:api", this.onApi);
    Emit.on("envim:mouse", this.onMouse);
    Emit.on("envim:input", this.onInput);
    Emit.on("envim:command", this.onCommand);
    Emit.on("envim:ready", this.onReady);
    Emit.on("envim:theme", this.onTheme);
    process.on("uncaughtException", this.onError);
    process.on("unhandledRejection", this.onError);
    nativeTheme.on("updated", this.handleTheme);
  }

  private onConnect = async (type: string, value: string, path: string ) => {
    let reader, writer;

    switch (type) {
      case "command":
        this.connect.process = spawn(value, ["--embed"]);
        [reader, writer] = [this.connect.process.stdout, this.connect.process.stdin];
      break;
      case "address":
        const [port, host] = value.split(":").reverse();
        this.connect.socket = createConnection({ port: +port, host: host });
        this.connect.socket.setNoDelay();
        [reader, writer] = [this.connect.socket, this.connect.socket];
      break;
    }

    if (reader && writer) {
      this.nvim = new NeovimClient;
      this.nvim.attach({ reader, writer });
      this.nvim.setClientInfo("Envim", { major: 0, minor: 0, patch: 1, prerelease: "dev" }, "ui", {}, {})
      this.nvim.on("disconnect", this.onDisconnect);
      await this.nvim.setVar('envim_id', await this.nvim.channelId);
      new App(this.nvim);
      Emit.send("app:switch", true);
      Emit.share("browser:update");

      this.handleTheme();
      path && this.onCommand(`cd ${path}`);
    }
  }

  private onAttach = async (width: number, height: number, options: UiAttachOptions) => {
    await this.nvim.uiAttach(width, height, { ...{ ext_linegrid: true }, ...options });
    await this.onCommand("doautocmd VimEnter");
    await this.onCommand("doautocmd envim DirChanged");
  }

  private onResize = (grid: number, width: number, height: number) => {
    this.nvim.uiTryResizeGrid(grid, width, height)
  }

  private onApi = async (fname: string, args: any[]) => {
    return await this.nvim.request(fname, args);
  }

  private onMouse = async (grid: number, button: string, action: string, modifier: string, row: number, col: number) => {
    return await this.nvim.inputMouse(button, action, modifier, grid, row, col);
  }

  private onInput = async (input: string) => {
    return await this.nvim.input(input);
  }

  private onCommand = async (command: string) => {
    return await this.nvim.command(command);
  }

  private onReady = (grid: number) => {
    Grids.get(grid).onReady();
    Grids.flush();
  }

  private onDisconnect = () => {
    Emit.send("app:switch", false);
    Emit.share("browser:hide");
  }

  private onError = (e: Error | any) => {
    if (e instanceof Error) {
      dialog.showErrorBox('Error', `${e.message}\n${e.stack || ""}`);
    } else if (e instanceof String) {
      dialog.showErrorBox('Error', e.toString());
    }
    this.onDisconnect();
  }

  private onTheme = (theme: "dark" | "light" | "system") => {
    if (theme === "system") {
      theme = nativeTheme.shouldUseDarkColors ? "dark" : "light"
    }

    Emit.update("app:theme", false, theme);

    return theme;
  }

  private handleTheme = () => {
    const theme = this.onTheme("system");
    this.nvim.isApiReady && this.onCommand(`set background=${theme}`)
  }
}
