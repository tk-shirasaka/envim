import { app, dialog, BrowserWindow, Menu, Input } from "electron";
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

  private openUrl = (id: number, url?: string) => {
    if (!Browser.main) return;
    const { x, y, width, height } = Browser.main.getBounds()
    const  win = this.getBrowserWindows().find(win => win.id === id) || new BrowserWindow({
      x: x + width / 2,
      y: y,
      width: width / 2,
      height: height,
      webPreferences: { partition: "browser" },
    });
    win.id === id || this.openBrowser(win);

    if (url && url.search(/^https?:\/\/\w+/) < 0) {
      url = `https://google.com/search?q=${encodeURI(url)}`;
    }

    url && win.loadURL(url);
    win.show();
  }

  private openBrowser(win: BrowserWindow) {
    let search: string = "";

    win.on("show", () => {
      const isOpenDevTools = this.getBrowserWindows().filter(w => {
        if (w.id === win.id) return false;

        const result = w.webContents.isDevToolsOpened();
        result && w.webContents.closeDevTools();
        w.hide();

        return result;
      }).length > 0;
      this.browserUpdate();
      isOpenDevTools && win.webContents.openDevTools();
    });
    win.on("close", () => this.getBrowserWindows().length > 1 || win.webContents.session.clearStorageData());
    win.on("closed", () => this.browserUpdate());
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
      input.key === "j" && this.rotateWindows(win, 1);
      input.key === "k" && this.rotateWindows(win, -1);
      input.key === "r" && win.webContents.reloadIgnoringCache();
      input.key === "i" && win.webContents.toggleDevTools();
      input.key === "w" && this.rotateWindows(win, -1) && win.close();
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
    win.webContents.on("will-prevent-unload", (e: Event) => {
      const options = { message: "Leave this page?", buttons: ["Yes", "no"], defaultId: 0 };
      if (dialog.showMessageBoxSync(options) === 0) {
        e.preventDefault();
      }
    });
    win.webContents.on("did-finish-load", () => this.browserUpdate());
    win.webContents.on("devtools-opened", () => win.focus());
  }

  private closeUrl = (id: number = -1) => {
    this.getBrowserWindows().forEach(win => [win.id, -1].indexOf(id) < 0 || win.close())
  }

  private browserUpdate() {
    Emit.send("browser:update", this.getBrowserWindows().map(win => (
      { id: win.id, title: win.getTitle(), url: win.webContents.getURL(), active: win.isVisible() }
    )));
  }

  private rotateWindows(win: BrowserWindow, direction: 1 | -1) {
    const windows = this.getBrowserWindows();
    const index = (windows.length + windows.indexOf(win) + direction) % windows.length;
    const result = windows.length > 0;

    result && windows[index].show();
    return result;
  }

  private getBrowserWindows() {
    return BrowserWindow.getAllWindows().filter(win => win.id !== Browser.main?.id);
  }
}
