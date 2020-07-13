import { Menu } from "electron";

export const setMenu = () => {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: "Window",
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "togglefullscreen" },
        { role: "reload" },
      ],
    },
  ]));
};
