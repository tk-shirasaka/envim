import { Menu } from "electron";

import { Emit } from "./emit";

export const setMenu = (inited: boolean) => {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: "Window",
      submenu: [
        { label: "Detach", click: () => Emit.send("envim:detach"), enabled: inited },
        { role: "reload", enabled: !inited },
        { type: "separator" },
        { label: "Zoom In", click: () => Emit.share("envim:zoom-in"), enabled: inited  },
        { label: "Zoom Out", click: () => Emit.share("envim:zoom-out"), enabled: inited  },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { label: "Undo", click: () => Emit.send("envim:command", "normal u"), enabled: inited },
        { label: "Redo", click: () => Emit.send("envim:command", "normal R"), enabled: inited },
        { type: "separator" },
        { label: "Cut", click: () => Emit.send("envim:command", "normal x"), enabled: inited },
        { label: "Copy", click: () => Emit.send("envim:command", "normal y"), enabled: inited },
        { label: "Paste", click: () => Emit.send("envim:command", "normal p"), enabled: inited },
      ],
    },
  ]));
};
