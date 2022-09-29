import { app, BrowserWindow, Menu, Input } from "electron";
import { join } from "path";

import { Emit } from "./emit";

export class Browser {
  static main?: BrowserWindow;

  constructor() {
    app.disableHardwareAcceleration();
    app.on("ready", this.onReady);
    app.on("activate", this.onActivate);
    app.on("window-all-closed", this.onQuit);
    Emit.on("browser:open", this.openUrl);
    Emit.on("browser:close", this.closeUrl);
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
    Browser.main.on("closed", () => delete(Browser.main) && this.closeUrl());
    Browser.main.once("ready-to-show", () => Emit.share("envim:theme", "system"));
  }

  private openUrl = (url: string) => {
    if (!Browser.main) return;
    const { x, y, width, height } = Browser.main.getBounds()
    const  win = new BrowserWindow({ show: false, x: x + width / 2, y: y, width: width / 2, height: height });
    win.on("ready-to-show", () => win?.show());
    this.openBrowser(win);

    if (url.search(/^https?:\/\/\w+/) < 0) {
      url = `https://google.com/search?q=${encodeURI(url)}`;
    }

    win.loadURL(url);
  }

  private openBrowser(win: BrowserWindow) {
    let search: string = "";

    win.webContents.on("did-create-window", (win: BrowserWindow) => this.openBrowser(win));
    win.webContents.on("before-input-event", (e: Event, input: Input) => {
      if (input.type === "keyUp" || (!input.control && !input.meta)) return;
      input.key === "a" && win.webContents.selectAll();
      input.key === "c" && win.webContents.copy();
      input.key === "v" && win.webContents.paste();
      input.key === "x" && win.webContents.cut();
      input.key === "z" && win.webContents.undo();
      input.key === "y" && win.webContents.redo();
      input.key === "h" && win.webContents.goBack();
      input.key === "l" && win.webContents.goForward();
      input.key === "r" && win.webContents.reloadIgnoringCache();
      input.key === "i" && win.webContents.toggleDevTools();
      input.key === "n" && search && win.webContents.findInPage(search, { forward: true });
      input.key === "N" && search && win.webContents.findInPage(search, { forward: false });
      input.key === "f" && (async () => {
        Browser.main?.focus();

        const args = ["input", ["Search: ", search]]
        search = await Emit.share("envim:api", "nvim_call_function", args) || "";
        search ? win.webContents.findInPage(search) : win.webContents.stopFindInPage("clearSelection");

        win.focus();
      })();
      e.preventDefault();
    });
    win.webContents.on("did-finish-load", () => {
      const url = win.webContents.getURL();
      const title = win.getTitle();
      win.setTitle(`[${url}] ${title}`);
    });
  }

  private closeUrl() {
    BrowserWindow.getAllWindows().forEach((win: BrowserWindow) =>
      win.id === Browser.main?.id || win.close()
    );
  }
}
