import { Menu } from "electron";

export const setMenu = (packed: boolean) => {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: "Window",
      submenu: packed ?  [
        { role: "about" },
        { type: "separator" },
        { role: "minimize" },
        { role: "togglefullscreen" },
        { role: "reload" },
        { type: "separator" },
        { role: "quit" },
      ] : [
        { role: "about" },
        { type: "separator" },
        { role: "minimize" },
        { role: "togglefullscreen" },
        { role: "reload" },
        { type: "separator" },
        { role: "quit" },
        { type: "separator" },
        { role: "toggleDevTools" },
      ],
    },
  ]));
};
