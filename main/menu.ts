import { Menu } from "electron";

export const setMenu = () => {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: "Window",
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "copy" },
        { role: "paste" },
        { type: "separator" },
        { role: "togglefullscreen" },
        { role: "reload" },
      ],
    },
  ]));
};
