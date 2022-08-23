import { app, BrowserWindow, Menu } from "electron";
import { join } from "path";

export class Browser {
  static win?: BrowserWindow;

  constructor() {
    app.commandLine.appendSwitch('enable-transparent-visuals');
    app.disableHardwareAcceleration();
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
    app.quit();
  }

  private create() {
    if (Browser.win) return;

    Menu.setApplicationMenu(Menu.buildFromTemplate([]));
    Browser.win = new BrowserWindow({
      transparent: true,
      resizable: true,
      hasShadow: false,
      titleBarStyle: "hidden",
      titleBarOverlay: true,
      webPreferences: {
        preload: join(__dirname, "preload.js"),
      },
    });

    Browser.win.maximize();
    Browser.win.loadFile(join(__dirname, "index.html"));
    Browser.win.on("closed", () => delete(Browser.win));
  }
}
