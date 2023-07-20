import { dialog, nativeTheme } from "electron";
import { join } from "path"
import { readFile } from "fs/promises";
import { NeovimClient } from "neovim";
import { UiAttachOptions } from "neovim/lib/api/Neovim"

import { ISetting } from "common/interface";

import { Emit } from "./emit";
import { Connect } from "./connect";
import { Setting } from "./setting";
import { App } from "./envim/app";
import { Grids } from "./envim/grid";

export class Envim {
  private nvim = new NeovimClient;

  constructor() {
    Emit.on("envim:init", this.onInit);
    Emit.on("envim:connect", this.onConnect);
    Emit.on("envim:setting", this.onSetting);
    Emit.on("envim:attach", this.onAttach);
    Emit.on("envim:resize", this.onResize);
    Emit.on("envim:position", this.onPosition);
    Emit.on("envim:option", this.onOption);
    Emit.on("envim:api", this.onApi);
    Emit.on("envim:mouse", this.onMouse);
    Emit.on("envim:input", this.onInput);
    Emit.on("envim:command", this.onCommand);
    Emit.on("envim:luafile", this.onLuafile);
    Emit.on("envim:ready", this.onReady);
    Emit.on("envim:theme", this.onTheme);
    process.on("uncaughtException", this.onError);
    process.on("unhandledRejection", this.onError);
    nativeTheme.on("updated", this.handleTheme);
  }

  private onInit = () => {
    const setting = Setting.get();

    setting && Emit.send("envim:setting", setting);
  }

  private onConnect = async (type: string, value: string, path: string ) => {
    const attach = async(nvim: NeovimClient) => {
      this.nvim = nvim;
      this.nvim.setClientInfo("Envim", { major: 0, minor: 0, patch: 1, prerelease: "dev" }, "ui", {}, {})
      this.nvim.on("disconnect", this.onDisconnect);
      await this.nvim.setVar('envim_id', await this.nvim.channelId);
      new App(this.nvim);
      Emit.send("app:switch", true);
      Emit.share("browser:update");

      this.handleTheme();
      path && this.onCommand(`cd ${path}`);
    }

    switch (type) {
      case "command": return Connect.command(value, attach);
      case "address": return Connect.network(value, attach);
      case "docker": return Connect.docker(value, attach);
      case "ssh": return Connect.ssh(value, attach);
    }
  }

  private onSetting = (setting: ISetting) => {
    Setting.set(setting);
  }

  private onAttach = async (width: number, height: number, options: UiAttachOptions) => {
    await this.nvim.uiAttach(width, height, { ...{ ext_linegrid: true }, ...options });
    await this.onCommand("doautocmd VimEnter");
    await this.onCommand("doautocmd envim DirChanged");
  }

  private onResize = (grid: number, width: number, height: number) => {
    grid ? this.nvim.uiTryResizeGrid(grid, width, height) : this.nvim.uiTryResize(width, height);
  }

  private onPosition = (grid: number, x: number, y: number) => {
    Grids.get(grid).setInfo({ x, y });
    Grids.setStatus(grid, "show", true);
    Grids.flush();
  }

  private onOption = async (name: string, value: boolean) => {
    return await this.nvim.uiSetOption(name, value);
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

  private onLuafile = (path: string) => {
    readFile(join(__dirname, "lua", path), { encoding: "utf8" }).then((file) => {
      this.nvim.lua(file);
    });
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

  private onTheme = (theme?: "dark" | "light" | "system") => {
    if (!theme || theme === "system") {
      theme = nativeTheme.shouldUseDarkColors ? "dark" : "light"
    }

    nativeTheme.themeSource = theme;
    Emit.update("app:theme", false, theme);

    return theme;
  }

  private handleTheme = () => {
    const theme = this.onTheme("system");
    this.nvim.isApiReady && this.onCommand(`set background=${theme}`)
  }
}
