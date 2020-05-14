import { app, Menu } from "electron";

import { Emit } from "./emit";

export const setMenu = (inited: boolean) => {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: "Window",
      submenu: app.isPackaged ?  [
        { role: "quit" },
        { label: "Detach", click: () => Emit.share("envim:detach"), enabled: inited },
        { role: "reload", enabled: !inited },
      ] : [
        { role: "quit" },
        { label: "Detach", click: () => Emit.share("envim:detach"), enabled: inited },
        { role: "reload", enabled: !inited },
        { type: "separator" },
        { role: "toggleDevTools" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { label: "Undo", click: () => Emit.share("envim:command", "undo"), enabled: inited },
        { label: "Redo", click: () => Emit.share("envim:command", "redo"), enabled: inited },
        { type: "separator" },
        { label: "Cut", click: () => Emit.share("envim:command", "normal x"), enabled: inited },
        { label: "Copy", click: () => Emit.share("envim:command", "normal y"), enabled: inited },
        { label: "Paste", click: () => Emit.share("envim:command", "normal p"), enabled: inited },
      ],
    },
  ]));
};
