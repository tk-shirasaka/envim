import { clipboard } from "electron";
import { dialog, BrowserWindow, Input } from "electron";

import { IBrowser } from "../common/interface";

import { Bootstrap } from "./bootstrap";
import { Emit } from "./emit";

class Browser {
  private search: string = "";
  private mode: "vim" | "browser" = "vim";
  private devtool: boolean = false;
  private info: IBrowser= { id: 0, title: "", origin: "", protocol: "", active: false };

  constructor(private win: BrowserWindow, parent: BrowserWindow, url?: string) {
    win.setBounds(parent.getBounds());
    win.on("show", this.updateInfo);
    win.on("hide", this.updateInfo);
    win.on("closed", this.onClosed);
    win.webContents.setWindowOpenHandler(this.createHandler);
    win.webContents.on("login", this.onBasicAuth);
    win.webContents.on("certificate-error", this.onCertError);
    win.webContents.on("page-title-updated", this.onUpdate);
    win.webContents.on("did-finish-load", this.onUpdate);
    win.webContents.on("did-navigate", this.onUpdate);
    win.webContents.on("did-navigate-in-page", this.onUpdate);
    win.webContents.on("did-create-window", this.onCreate);
    win.webContents.on("before-input-event", this.onInput);
    win.webContents.on("will-prevent-unload", this.onUnload);
    parent === Bootstrap.win && this.onOpen(url);
  }

  getBrowser() {
    return { info: this.info, win: this.win };
  }

  show() {
    if (!this.info.active) {
      this.devtool && this.win.webContents.openDevTools();
      this.win.show();
    }
    this.win.focus();
  }

  hide() {
    if (!this.info.active) return;

    this.devtool = this.win.webContents.isDevToolsOpened();
    this.devtool && this.win.webContents.closeDevTools();
    this.win.hide();
  }

  private updateInfo = () => {
    const url = this.win.webContents.getURL();
    const { origin, protocol } = url ? (new URL(url)) : { origin: "", protocol: "" }

    this.win.setTitle(`[${this.mode.toUpperCase()} ${origin}] : ${this.win.webContents.getTitle()}`)
    this.info = { id: this.win.id, title: this.win.webContents.getTitle(), origin, protocol, active: this.win.isVisible() };
  }

  private onClosed = () => {
    Emit.share("browser:closed", this.info.id);
  }

  private createHandler = () => {
    const action: "allow" = "allow";
    return { action, outlivesOpener: true };
  }

  private onBasicAuth = async (e: Event, _: Object, __: Object, callback: Function) => {
    e.preventDefault();

    const user = await this.getInput("User: ");
    const password = user && await this.getInput("Password: ");

    user && callback(user, password);
  }

  private onCertError = async (e: Event, _: string, __: string, ___: Object, callback: Function) => {
    if (this.confirm("Certication Error\nContinue it?")) {
      e.preventDefault();
      callback(true);
    }
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

    if (input.type === "keyUp") return;
    if (
      this.onInputCommon(input) === "not match" && (
        this.onInputBrowser(input) !== "not match" || this.onInputVim(input) !== "not match"
      )) {
      e.preventDefault();
    }
    this.mode === mode || this.onUpdate();
  }

  private getInput = async (prompt: string, value: string = "") => {
    const args = ["input", [prompt, value]]

    Bootstrap.win?.focus();
    value = await Emit.share("envim:api", "nvim_call_function", args) || "";
    this.win.focus();

    return value;
  }

  private confirm = (message: string) => {
    return dialog.showMessageBoxSync({ message, buttons: ["Yes", "No"], defaultId: 0 }) === 0;
  }

  private onSearch = async () => {
    this.search = await this.getInput("Search: ");
    this.search ? this.win.webContents.findInPage(this.search) : this.win.webContents.stopFindInPage("clearSelection");
  }

  private onOpen = async (input: string = "") => {
    input = input && !this.info.origin ? input : await this.getInput("Browser: ", input || clipboard.readText().slice(0, 500));

    if (input) {
      input = input.search(/^https?:\/\/\w+/) < 0 ? `https://google.com/search?q=${encodeURI(input)}` : input;
      this.win.loadURL(input);
      this.show();
    } else if (!this.info.origin) {
      this.win.close();
    }
  }

  private onInputCommon = (input: Input) => {
    switch (input.key) {
      case "Escape": return this.mode === "browser" && (this.mode = "vim") ? "not match" : "";
      case "Enter": return;
      case "Home": return;
      case "End": return;
      case "PageUp": return;
      case "PageDown": return;
      case "ArrowUp": return;
      case "ArrowDown": return;
      case "ArrowRight": return;
      case "ArrowLeft": return;
    }

    if (!input.control && !input.meta) return "not match";

    switch (input.key) {
      case "+": return this.win.webContents.setZoomLevel(Math.min(this.win.webContents.zoomLevel + 0.2, 5));
      case "-": return this.win.webContents.setZoomLevel(Math.max(this.win.webContents.zoomLevel - 0.2, -5));
      case "=": return this.win.webContents.setZoomLevel(0);
      case "a": return;
      case "c": return;
      case "v": return;
      case "x": return;
      case "z": return;
      case "y": return;
      case "p": return this.win.webContents.print();
      case "r": return this.win.webContents.reloadIgnoringCache();
      case "l": return this.onOpen(this.win.webContents.getURL());
      case "n": return Emit.share("browser:open", -1);
      case "w": return Emit.share("browser:rotate", this.win, -1, true);
      default: return "not match";
    }
  }

  private onInputVim = (input: Input) => {
    if (this.mode !== "vim") return "not match";

    switch (input.key.toLocaleLowerCase()) {
      case "a": return this.mode = "browser";
      case "y": return this.win.webContents.copy();
      case "p": return this.win.webContents.paste();
      case "x": return this.win.webContents.cut();
      case "o": return input.control ? this.win.webContents.goBack() : (this.mode = "browser");
      case "i": return input.control ? this.win.webContents.goForward() : (this.mode = "browser");
      case "g": return this.win.webContents.sendInputEvent({ type: "keyDown", keyCode: input.shift ? "End" : "Home" });
      case "u": return input.control && this.win.webContents.sendInputEvent({ type: "keyDown", keyCode: "PageUp" });
      case "d": return input.control && this.win.webContents.sendInputEvent({ type: "keyDown", keyCode: "PageDown" });
      case "k": return this.win.webContents.sendInputEvent({ type: "keyDown", keyCode: "Up", modifiers: input.shift ? ["shift"] : [] });
      case "j": return this.win.webContents.sendInputEvent({ type: "keyDown", keyCode: "Down", modifiers: input.shift ? ["shift"] : [] });
      case "h": return this.win.webContents.sendInputEvent({ type: "keyDown", keyCode: "Left", modifiers: input.shift ? ["shift"] : [] });
      case "l": return this.win.webContents.sendInputEvent({ type: "keyDown", keyCode: "Right", modifiers: input.shift ? ["shift"] : [] });
      case "tab": return Emit.share("browser:rotate", this.win, input.shift ? -1 : 1);
      case "q": return Emit.share("browser:close", this.info.id);
      case "n": return this.search && this.win.webContents.findInPage(this.search, { forward: !input.shift });
      case "/": return this.onSearch();
    }
  }

  private onInputBrowser = (input: Input) => {
    if ((!input.control && !input.meta) || this.mode !== "browser") return "not match";

    switch (input.key) {
      case "i": return this.win.webContents.toggleDevTools();
      default: return "not match";
    }

  }

  private onUnload = (e: Event) => {
    this.confirm("Leave this page?") && e.preventDefault();
  }
}

export class Browsers {
  private browsers: Browser[] = [];
  private next?: BrowserWindow;

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

    Bootstrap.win && this.onShow(win, Bootstrap.win, url);
  }

  private onShow = (win: BrowserWindow, parent: BrowserWindow, url?: string) => {
    const current = this.getBrowser().findIndex(({ info }) => info.active);
    const exists = this.browsers.filter(browser => {
      const { info } = browser.getBrowser();
      const result = info.id === win.id;

      result || browser.hide();
      return result;
    });

    if (win === Bootstrap.win) {
      Bootstrap.win.focus();
    } else if (exists.length > 0) {
      exists.pop()?.show();
      this.onUpdate();
    } else {
      this.browsers.splice(current < 0 ? this.browsers.length : current + 1, 0, new Browser(win, parent, url));
    }
    delete(this.next);
  }

  private onClose = (id: number) => {
    this.getBrowser().forEach(({ win }) => {
      win.id === id && win.close();
    });
  }

  private onHide = () => {
    Bootstrap.win && this.onShow(Bootstrap.win, Bootstrap.win);
  }

  private onClosed = (id: number) => {
    const win = this.next || Bootstrap.win;

    this.browsers = this.browsers.filter(browser => {
      const { info } = browser.getBrowser();

      return info.id !== id;
    });
    this.onUpdate();
    !this.getBrowser().some(({ info }) => info.active) && win && this.onShow(win, win);
  }

  private onUpdate = () => {
    Emit.update("browser:update", true, this.getBrowser().reverse().map(({ info }) => info));
  }

  private onRotate = (win: BrowserWindow, direction: 1 | -1, close: boolean) => {
    const windows = this.getBrowser().map(({ win }) => win);
    const index = (windows.length + windows.indexOf(win) + direction) % windows.length;

    this.next = windows[index] && win !== windows[index] ? windows[index] : Bootstrap.win;
    close ? win.close() : this.onShow(windows[index], windows[index]);
  }

  private getBrowser = () => {
    return this.browsers.map(browser => browser.getBrowser());
  }
}
