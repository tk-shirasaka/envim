import { app, dialog, WebContents, Event, HandlerDetails, AuthenticationResponseDetails, AuthInfo, ContextMenuParams, Input } from "electron";

import { Bootstrap } from "./bootstrap";
import { Emit } from "./emit";

export class Browser {
  constructor(private webContents: WebContents) {
    webContents.setWindowOpenHandler(this.onOpenWindow);
    webContents.on("devtools-open-url", this.onOpenUrl);
    webContents.on("login", this.onLogin);
    webContents.on("will-prevent-unload", this.onUnload);
    webContents.on("context-menu", this.onContextMenu);
    webContents.on("before-input-event", this.onInput);
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

  private onLogin = async (e: Event, _: AuthenticationResponseDetails, __: AuthInfo, callback: Function) => {
    e.preventDefault();

    const user = await Emit.share("envim:api", "nvim_call_function", ["EnvimInput", ["User"]]);
    const password = await Emit.share("envim:api", "nvim_call_function", ["EnvimInput", ["Password"]]);

    user && callback(user, password);
  }

  private onUnload = (e: Event) => {
    if (dialog.showMessageBoxSync({ message: "Leave this page?", buttons: ["Yes", "No"], defaultId: 0 }) === 0) {
      e.preventDefault();
    }
  }

  private onContextMenu = (_: Event, params: ContextMenuParams) => {
    const contents = params.selectionText || params.srcURL;
    contents && Emit.share("envim:browser", contents);
  }

  private onInput = (_: Event, input: Input) => {
    switch (input.key) {
      case "Escape": return Emit.send("webview:action", this.webContents.id, "mode-command");
    }
  }
}
