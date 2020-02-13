import { app, BrowserWindow } from "electron";

import { setMenu } from "./menu";

export class Browser {
  static win?: BrowserWindow;

  constructor() {
    app.on("ready", this.onReady.bind(this));
    app.on("activate", this.onActivate.bind(this));
    app.on("window-all-closed", this.onWindowAllClosed.bind(this));
  }

  private onReady() {
    setTimeout(this.create, 300);
  }

  private onActivate() {
    setTimeout(this.create, 300);
  }

  private onWindowAllClosed() {
    if (process.platform !== "darwin") app.quit();
  }

  private create() {
    if (Browser.win) return;

    setMenu(false);
    Browser.win = new BrowserWindow({
      transparent: true,
      frame: process.platform !== "darwin",
      webPreferences: {
        nodeIntegration: true,
      },
    });

    Browser.win.loadURL(`file://${__dirname}/../index.html`);
    Browser.win.on("closed", () => delete(Browser.win));
  }
}
