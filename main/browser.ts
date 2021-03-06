import { app, BrowserWindow } from "electron";
import { join } from "path";

import { setMenu } from "./menu";
import { Emit } from "./emit";

export class Browser {
  static win?: BrowserWindow;

  constructor() {
    app.commandLine.appendSwitch('enable-transparent-visuals');
    app.disableHardwareAcceleration();
    app.on("ready", this.onReady.bind(this));
    app.on("activate", this.onActivate.bind(this));
    app.on("window-all-closed", this.onQuit.bind(this));
    Emit.on("app:quit", this.onQuit.bind(this));
  }

  private onReady() {
    setTimeout(this.create, 300);
  }

  private onActivate() {
    setTimeout(this.create, 300);
  }

  private onQuit() {
    app.quit();
  }

  private create() {
    if (Browser.win) return;

    setMenu();
    Browser.win = new BrowserWindow({
      transparent: true,
      resizable: true,
      frame: false,
      hasShadow: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        worldSafeExecuteJavaScript: true,
        preload: join(__dirname, "preload.js"),
      },
    });

    Browser.win.maximize();
    Browser.win.loadFile(join(__dirname, "index.html"));
    Browser.win.on("closed", () => delete(Browser.win));
  }
}
