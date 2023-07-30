import { app, BrowserWindow, Menu } from "electron";
import { join } from "path";

import { Emit } from "./emit";

export class Bootstrap {
  static win?: BrowserWindow;

  constructor() {
    Menu.setApplicationMenu(null);
    app.commandLine.appendSwitch('remote-debugging-port', '8315');
    app.on("ready", this.onReady);
    app.on("activate", this.onActivate);
    app.on("window-all-closed", this.onQuit);
  }

  private onReady = () => {
    this.create();
  }

  private onActivate = () => {
    this.create();
  }

  private onQuit = () => {
    delete(Bootstrap.win);
    app.quit();
  }

  private create() {
    if (Bootstrap.win) return;

    Bootstrap.win = new BrowserWindow({
      transparent: true,
      resizable: true,
      hasShadow: false,
      titleBarStyle: "hidden",
      titleBarOverlay: true,
      webPreferences: {
        preload: join(__dirname, "preload.js"),
      },
    });

    Bootstrap.win.maximize();
    Bootstrap.win.loadFile(join(__dirname, "index.html"));
    Bootstrap.win.on("closed", this.onQuit);
    Bootstrap.win.on("focus", () => Emit.send("envim:focus"));
    Bootstrap.win.once("ready-to-show", () => Emit.share("envim:theme"));
  }
}
