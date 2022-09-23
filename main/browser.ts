import { app, BrowserWindow, Menu } from "electron";
import { join } from "path";

import { Emit } from "./emit";

export class Browser {
  static main?: BrowserWindow;
  static sub?: BrowserWindow;

  constructor() {
    app.disableHardwareAcceleration();
    app.on("ready", this.onReady);
    app.on("activate", this.onActivate);
    app.on("window-all-closed", this.onQuit);
    Emit.on("browser:url", this.openUrl);
    Emit.on("browser:control", this.control);
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
    if (Browser.main) return;

    Menu.setApplicationMenu(Menu.buildFromTemplate([]));
    Browser.main = new BrowserWindow({
      transparent: true,
      resizable: true,
      hasShadow: false,
      titleBarStyle: "hidden",
      titleBarOverlay: true,
      webPreferences: {
        preload: join(__dirname, "preload.js"),
      },
    });

    Browser.main.maximize();
    Browser.main.loadFile(join(__dirname, "index.html"));
    Browser.main.on("closed", () => delete(Browser.main));
    Browser.main.once("ready-to-show", () => Emit.share("envim:theme", "system"));
  }

  private openUrl = (url: string) => {
    if (!Browser.main) return;
    if (!Browser.sub) {
      Browser.sub = new BrowserWindow({ parent: Browser.main, show: false });
      Browser.sub.on("ready-to-show", () => Browser.sub?.show());
      Browser.sub.on("close", () => delete(Browser.sub));
      Browser.sub.webContents.session.clearStorageData();
      Browser.sub.webContents.on("before-input-event", (e: Event, input: Electron.Input) => {
        if (input.type === "keyUp" || (!input.control && !input.meta)) return;
        input.key === "h" && this.control("prev");
        input.key === "l" && this.control("next");
        input.key === "r" && this.control("reload");
        input.key === "i" && this.control("devtool");
        e.preventDefault();
      });
    }

    if (url.search(/^https?:\/\/\w+/) < 0) {
      url = `https://google.com/search?q=${encodeURI(url)}`;
    }

    Browser.sub.loadURL(url);
  }

  private control(control: "prev" | "next" | "reload" | "devtool" | "close") {
    if (!Browser.sub) return;

    switch (control) {
      case "prev":
        return Browser.sub.webContents.goBack();
      case "next":
        return Browser.sub.webContents.goForward();
      case "reload":
        return Browser.sub.webContents.reloadIgnoringCache();
      case "devtool":
        return Browser.sub.webContents.toggleDevTools();
      case "close":
        return Browser.sub.close();
    }
  }
}
