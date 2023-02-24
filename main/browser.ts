import { dialog, BrowserWindow, Input } from "electron";

import { Bootstrap } from "./bootstrap";
import { Emit } from "./emit";

class Browser {
  private search: string = "";
  private mode: "vim" | "browser" = "vim";
  private devtool: boolean = false;
  private info: { id: number; title: string; url: string; active: boolean } = { id: 0, title: "", url: "", active: false };

  constructor(private win: BrowserWindow, parent?: BrowserWindow) {
    parent = parent || Bootstrap.win;

    if (!parent) return;

    win.setBounds(parent.getBounds());
    win.on("show", this.updateInfo);
    win.on("hide", this.updateInfo);
    win.on("closed", this.onClosed);
    win.webContents.on("page-title-updated", this.onUpdate);
    win.webContents.on("did-finish-load", this.onUpdate);
    win.webContents.on("did-navigate", this.onUpdate);
    win.webContents.on("did-navigate-in-page", this.onUpdate);
    win.webContents.on("did-create-window", this.onCreate);
    win.webContents.on("before-input-event", this.onInput);
    win.webContents.on("will-prevent-unload", this.onUnload);
    win.show();
  }

  getBrowser() {
    return { info: this.info, win: this.win };
  }

  show() {
    if (this.info.active) return;

    this.devtool && this.win.webContents.openDevTools();
    this.win.show();
  }

  hide() {
    if (!this.info.active) return;

    this.devtool = this.win.webContents.isDevToolsOpened();
    this.devtool && this.win.webContents.closeDevTools();
    this.win.hide();
  }

  private updateInfo = () => {
    this.win.setTitle(`[${this.mode.toUpperCase()}] : ${this.win.webContents.getTitle()}`)
    this.info = { id: this.win.id, title: this.win.getTitle(), url: this.win.webContents.getURL(), active: this.win.isVisible() };
  }

  private onClosed = () => {
    Emit.share("browser:closed", this.info.id);
  }

  private onUpdate = () => {
    this.updateInfo();
    Emit.share("browser:update");
  }

  private onCreate = (win: BrowserWindow) => {
    Emit.share("browser:show", win, this.win);
  }

  private onInput = (e: Event, input: Input) => {
    const mode = this.mode;
    if (mode === "browser" && !input.control && input.key !== "Escape") return;

    mode === "vim" && this.onInputVim(input);
    mode === "browser" && this.onInputBrowser(input);

    e.preventDefault();
    this.mode === mode || this.onUpdate();
  }

  private getInput = async (prompt: string, value: string = "") => {
    const args = ["input", [prompt, value]]

    Bootstrap.win?.focus();
    value = await Emit.share("envim:api", "nvim_call_function", args) || "";
    this.win.focus();

    return value;
  }

  private onInputVim = (input: Input) => {
    input.key === "i" && (this.mode = "browser");
    input.key === "y" && this.win.webContents.copy();
    input.key === "p" && this.win.webContents.paste();
    input.key === "h" && this.win.webContents.goBack();
    input.key === "l" && this.win.webContents.goForward();
    input.key === "j" && this.win.webContents.sendInputEvent({ type: "mouseWheel", x: 0, y: 0, deltaY: -100 });
    input.key === "k" && this.win.webContents.sendInputEvent({ type: "mouseWheel", x: 0, y: 0, deltaY: 100 });
    input.key === "Tab" && Emit.share("browser:rotate", this.win, input.shift ? -1 : 1);
    input.key === "q" && Emit.share("browser:close", this.info.id);
    input.key === "n" && this.search && this.win.webContents.findInPage(this.search, { forward: true });
    input.key === "N" && this.search && this.win.webContents.findInPage(this.search, { forward: false });
    input.key === "/" && (async () => {
      this.search = await this.getInput("Search: ", this.search);
      this.search ? this.win.webContents.findInPage(this.search) : this.win.webContents.stopFindInPage("clearSelection");
    })();
  }

  private onInputBrowser = (input: Input) => {
    input.key === "Escape" && (this.mode = "vim");
    input.key === "a" && this.win.webContents.selectAll();
    input.key === "c" && this.win.webContents.copy();
    input.key === "v" && this.win.webContents.paste();
    input.key === "x" && this.win.webContents.cut();
    input.key === "z" && this.win.webContents.undo();
    input.key === "y" && this.win.webContents.redo();
    input.key === "r" && this.win.webContents.reloadIgnoringCache();
    input.key === "i" && this.win.webContents.toggleDevTools();
    input.key === "l" && (async () =>
      Emit.share("browser:open", this.info.id, await this.getInput("Browser: ", this.win.webContents.getURL()))
    )();
  }

  private onUnload = (e: Event) => {
    const options = { message: "Leave this page?", buttons: ["Yes", "no"], defaultId: 0 };
    if (dialog.showMessageBoxSync(options) === 0) {
      e.preventDefault();
    }
  }
}

export class Browsers {
  private browsers: Browser[] = [];

  constructor() {
    Emit.on("browser:open", this.onOpen);
    Emit.on("browser:show", this.onShow);
    Emit.on("browser:hide", this.onHide);
    Emit.on("browser:update", this.onUpdate);
    Emit.on("browser:rotate", this.onRotate);
    Emit.on("browser:close", this.onClose);
    Emit.on("browser:closed", this.onClosed);
  }

  private onOpen = (id: number, url?: string) => {
    const exists = this.getBrowser().find(({ win }) => win.id === id);
    const win = exists?.win || new BrowserWindow({
      show: false,
      webPreferences: { partition: "browser" },
    });

    if (url) {
      url = url.search(/^https?:\/\/\w+/) < 0 ? `https://google.com/search?q=${encodeURI(url)}` : url;
      win.loadURL(url);
    }

    Bootstrap.win && this.onShow(win);
  }

  private onShow = (win: BrowserWindow, parent?: BrowserWindow) => {
    const exists = this.browsers.filter(browser => {
      const { info } = browser.getBrowser();
      const result = info.id === win.id;

      result ? browser.show() : browser.hide();
      return result;
    }).length > 0;

    exists || this.browsers.push(new Browser(win, parent));
    this.onUpdate();
  }

  private onClose = (id: number) => {
    this.getBrowser().forEach(({ win }) => {
      win.id === id && win.close();
    });
  }

  private onHide = () => {
    this.browsers.forEach(browser => browser.hide());
    this.onUpdate();
    Bootstrap.win?.focus();
  }

  private onClosed = (id: number) => {
    this.browsers = this.browsers.filter(browser => {
      const { info } = browser.getBrowser();

      return info.id !== id;
    });
    this.onUpdate();
    Bootstrap.win?.focus();
  }

  private onUpdate = () => {
    Emit.update("browser:update", true, this.getBrowser().reverse().map(({ info }) => info));
  }

  private onRotate = (win: BrowserWindow, direction: 1 | -1) => {
    const windows = this.getBrowser().map(({ win }) => win);
    const index = windows.indexOf(win) + direction;

    0 <= index && index < windows.length ? this.onShow(windows[index]) : this.onHide();
  }

  private getBrowser = () => {
    return this.browsers.map(browser => browser.getBrowser());
  }
}
