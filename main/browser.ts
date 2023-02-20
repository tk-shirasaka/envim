import { app, dialog, BrowserWindow, Menu, Input } from "electron";
import { join } from "path";

import { Emit } from "./emit";

export class Browser {
  static main?: BrowserWindow;

  constructor() {
    app.commandLine.appendSwitch('remote-debugging-port', '8315');
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
    const exists = this.getBrowserWindows().find(win => win.id === id);
    const win = exists || new BrowserWindow({
      show: false,
      webPreferences: { partition: "browser" },
    });
    exists ? win.show() : (Browser.main && this.openBrowser(win, Browser.main));

    if (url && url.search(/^https?:\/\/\w+/) < 0) {
      url = `https://google.com/search?q=${encodeURI(url)}`;
    }

    url && win.loadURL(url);
  }

  private openBrowser(win: BrowserWindow, parent: BrowserWindow) {
    let ctx: { search: string; mode: "vim" | "browser" } = { search: "", mode: "vim" };
    const cmdline = async (prompt: string, value: string = "") => {
      const args = ["input", [prompt, value]]

      Browser.main?.focus();
      value = await Emit.share("envim:api", "nvim_call_function", args) || "";
      win.focus();

      return value;
    };

    win.setBounds(parent.getBounds());
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
    win.webContents.on("did-create-window", (next: BrowserWindow) => this.openBrowser(next, win));
    win.webContents.on("before-input-event", (e: Event, input: Input) => {
      if (ctx.mode === "browser" && !input.control && input.key !== "Escape") return;
      ctx.mode === "browser" && input.key === "Escape" && (ctx.mode = "vim");
      ctx.mode === "browser" && input.key === "a" && win.webContents.selectAll();
      ctx.mode === "browser" && input.key === "c" && win.webContents.copy();
      ctx.mode === "browser" && input.key === "v" && win.webContents.paste();
      ctx.mode === "browser" && input.key === "x" && win.webContents.cut();
      ctx.mode === "browser" && input.key === "z" && win.webContents.undo();
      ctx.mode === "browser" && input.key === "y" && win.webContents.redo();
      ctx.mode === "browser" && input.key === "r" && win.webContents.reloadIgnoringCache();
      ctx.mode === "browser" && input.key === "i" && win.webContents.toggleDevTools();
      ctx.mode === "browser" && input.key === "l" && (async () =>
        this.openUrl(win.id, await cmdline("Browser: ", win.webContents.getURL()))
      )();

      ctx.mode === "vim" && input.key === "y" && win.webContents.copy();
      ctx.mode === "vim" && input.key === "p" && win.webContents.paste();
      ctx.mode === "vim" && input.key === "i" && (ctx.mode = "browser");
      ctx.mode === "vim" && input.key === "h" && win.webContents.goBack();
      ctx.mode === "vim" && input.key === "l" && win.webContents.goForward();
      ctx.mode === "vim" && input.key === "j" && win.webContents.sendInputEvent({ type: "mouseWheel", x: 0, y: 0, deltaY: -100 });
      ctx.mode === "vim" && input.key === "k" && win.webContents.sendInputEvent({ type: "mouseWheel", x: 0, y: 0, deltaY: 100 });
      ctx.mode === "vim" && input.key === "Tab" && this.rotateWindows(win, input.shift ? -1 : 1);
      ctx.mode === "vim" && input.key === "q" && this.rotateWindows(win, -1) && win.close();
      ctx.mode === "vim" && input.key === "n" && ctx.search && win.webContents.findInPage(ctx.search, { forward: true });
      ctx.mode === "vim" && input.key === "N" && ctx.search && win.webContents.findInPage(ctx.search, { forward: false });
      ctx.mode === "vim" && input.key === "/" && (async () => {
        ctx.search = await cmdline("Search: ", ctx.search);
        ctx.search ? win.webContents.findInPage(ctx.search) : win.webContents.stopFindInPage("clearSelection");
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
    win.webContents.on("did-navigate", () => this.browserUpdate());
    win.webContents.on("did-navigate-in-page", () => this.browserUpdate());
    win.webContents.on("devtools-opened", () => win.focus());
    win.show();
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
