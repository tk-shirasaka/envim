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
    this.create();
  }

  private onActivate() {
    this.create();
  }

  private onWindowAllClosed() {
    if (process.platform !== "darwin") app.quit();
  }

  private create() {
    if (Browser.win) return;

    setMenu(false);
    Browser.win = new BrowserWindow({
      transparent: true,
      frame: false,
      webPreferences: {
        nodeIntegration: true,
      },
    });

    Browser.win.loadURL(`file://${__dirname}/../index.html`);
    Browser.win.on("closed", () => delete(Browser.win));
  }
}
