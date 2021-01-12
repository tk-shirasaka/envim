import { app, BrowserWindow } from "electron";

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
      webPreferences: {
        nodeIntegration: true,
      },
    });

    Browser.win.maximize();
    Browser.win.loadURL(`file://${__dirname}/../index.html`);
    Browser.win.on("closed", () => delete(Browser.win));
  }
}
