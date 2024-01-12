import { app, dialog, BrowserWindow, Menu, Event } from "electron";
import { join } from "path";

import { Emit } from "./emit";

export class Bootstrap {
  static win?: BrowserWindow;

  constructor() {
    Menu.setApplicationMenu(
      Menu.buildFromTemplate([
        { role: "editMenu", visible: true }
      ])
    );
    app.commandLine.appendSwitch("remote-debugging-port", "8315");
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
    delete(Bootstrap.win);
    app.quit();
  }

  private create() {
    if (Bootstrap.win) return;

    Bootstrap.win = new BrowserWindow({
      transparent: true,
      resizable: true,
      hasShadow: false,
      titleBarStyle: "hidden",
      titleBarOverlay: true,
      webPreferences: {
        webviewTag: true,
        spellcheck: false,
        preload: join(__dirname, "preload.js"),
      },
    });

    Bootstrap.win.maximize();
    Bootstrap.win.loadFile(join(__dirname, "index.html"));
    Bootstrap.win.on("closed", this.onQuit);
    Bootstrap.win.on("focus", () => Emit.send("envim:focus"));
    Bootstrap.win.once("ready-to-show", () => Emit.share("envim:theme"));
    Bootstrap.win.webContents.on("did-attach-webview", (_, webContents) => {
      webContents.setWindowOpenHandler(details => {
        const action = details.frameName || details.postBody ? "allow" : "deny";

        action === "deny" && Emit.share("envim:browser", details.url);
        action === "allow" && !details.frameName && app.once("browser-window-created", (_, browserWindow) => (
          browserWindow.webContents.once("did-navigate", () => {
            Emit.share("envim:browser", browserWindow.webContents.getURL());
            browserWindow.close();
          })
        ));

        return { action, overrideBrowserWindowOptions: { show: !!details.frameName } };
      });

      webContents.on("devtools-open-url", (_, url) => {
        Bootstrap.win?.focus();
        Emit.share("envim:browser", url);
      });

      webContents.on("login", async (e: Event, _, __, callback: Function) => {
        Emit.send("envim:focus");

        e.preventDefault();

        const user = await Emit.share("envim:api", "nvim_call_function", ["EnvimInput", ["User"]]);
        const password = await Emit.share("envim:api", "nvim_call_function", ["EnvimInput", ["Password"]]);

        user && callback(user, password);
      });

      webContents.on("will-prevent-unload", (e: Event) => {
        if (dialog.showMessageBoxSync({ message: "Leave this page?", buttons: ["Yes", "No"], defaultId: 0 }) === 0) {
          e.preventDefault();
        }
      });

      webContents.on("context-menu", (_, params) => {
        const contents = params.selectionText || params.srcURL;
        contents && Emit.share("envim:browser", contents);
      });

      webContents.on("before-input-event", (_, input) => {
        switch (input.key) {
          case "Escape": return Emit.send("webview:action", webContents.id, "mode-command");
        }
      })
    });
  }
}
