import { app, dialog, clipboard, WebContents, Event, HandlerDetails, LoginAuthenticationResponseDetails, AuthInfo, ContextMenuParams, Input } from "electron";
import { lookup } from "dns";

import { Bootstrap } from "./bootstrap";
import { Emit } from "./emit";

export class Browser {
  private ignoreCertErrorHost: string[] = [];

  constructor(private webContents: WebContents) {
    webContents.setWindowOpenHandler(this.onOpenWindow);
    webContents.on("devtools-open-url", this.onOpenUrl);
    webContents.on("login", this.onLogin);
    webContents.on("certificate-error", this.onCertError);
    webContents.on("will-prevent-unload", this.onUnload);
    webContents.on("context-menu", this.onContextMenu);
    webContents.on("before-input-event", this.onInput);
    Emit.on(`capture:${webContents.id}`, this.onCapture);
  }

  private confirm = (message: string) => {
    return dialog.showMessageBoxSync({ message, buttons: ["Yes", "No"], defaultId: 0 }) === 0;
  }

  private onOpenWindow = (details: HandlerDetails) => {
    const action: "allow" | "deny" = details.frameName || details.postBody ? "allow" : "deny";

    action === "deny" && Emit.share("envim:browser", details.url);
    action === "allow" && !details.frameName && app.once("browser-window-created", (_, browserWindow) => (
      browserWindow.webContents.once("did-navigate", () => {
        Emit.share("envim:browser", browserWindow.webContents.getURL());
        browserWindow.close();
      })
    ));

    return { action, overrideBrowserWindowOptions: { show: !!details.frameName } };
  }

  private onOpenUrl = (_: Event, url: string) => {
    Bootstrap.win?.focus();
    Emit.share("envim:browser", url);
  }

  private onLogin = async (e: Event, _: LoginAuthenticationResponseDetails, __: AuthInfo, callback: Function) => {
    e.preventDefault();

    const user = await Emit.share("envim:readline", "User");
    const password = await Emit.share("envim:readline", "Password");

    user && callback(user, password);
  }

  private onCertError = async (e: Event, url: string, __: string, ___: Object, callback: Function) => {
    const { hostname } = new URL(url);

    if (this.ignoreCertErrorHost.indexOf(hostname) < 0) {
      lookup(hostname, 4, (e, address) => {
        if (e) return;
        if (
          ["0.0.0.0", "127.0.0.1"].indexOf(address) >= 0 ||
          this.confirm(`Certication Error on "${hostname}"\nContinue it?`)
        ) {
          this.ignoreCertErrorHost.push(hostname);
          this.webContents.loadURL(url);
        }
      });
    } else {
      e.preventDefault();
      callback(true);
    }
  }

  private onUnload = (e: Event) => {
    this.confirm("Leave this page?") && e.preventDefault();
  }

  private onContextMenu = (_: Event, params: ContextMenuParams) => {
    const contents = params.selectionText || params.srcURL;

    if (params.srcURL === this.webContents.getURL()) {
      this.webContents.downloadURL(contents);
    } else if (contents) {
      Emit.share("envim:browser", contents);
    }
  }

  private onInput = (_: Event, input: Input) => {
    switch (input.key) {
      case "Escape": return Emit.send("webview:action", this.webContents.id, "mode-command");
    }
  }

  private onCapture = async () => {
    clipboard.writeImage(await this.webContents.capturePage());
  }
}
