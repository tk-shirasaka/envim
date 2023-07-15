import { ISetting } from "common/interface";

import { Localstorage } from "./localstorage";

const defaultSetting: ISetting = {
  type: "command",
  path: "",
  font: { size: 16, width: 8, height: 17, lspace: 2, scale: window.devicePixelRatio },
  opacity: 0,
  options: {
    ext_multigrid: true,
    ext_cmdline: true,
    ext_tabline: true,
    ext_popupmenu: true,
    ext_messages: true,
    ext_hlstate: true,
    ext_termcolors: true,
  },
  bookmarks: [],
  searchengines: [
    { name: "Google", uri: "https://google.com/search?q=${query}", selected: true },
  ],
  presets: {},
};

const ls: Localstorage<ISetting> = new Localstorage<ISetting>("setting", defaultSetting);

export class Setting {
  private static item: ISetting = ls.get();

  static get() {
    return Setting.item;
  }

  private static set(item: ISetting) {
    ls.set(item);
    Setting.item = ls.get();
  }

  static get type() {
    return Setting.item.type;
  }

  static set type(type: ISetting["type"]) {
    Setting.set({ ...Setting.item, type });
  }

  static get path() {
    return Setting.item.path;
  }

  static set path(path: ISetting["path"]) {
    Setting.set({ ...Setting.item, path });
  }

  static get font() {
    return Setting.item.font;
  }

  static set font(font: ISetting["font"]) {
    Setting.set({ ...Setting.item, font });
  }

  static get opacity() {
    return Setting.item.opacity;
  }

  static set opacity(opacity: ISetting["opacity"]) {
    Setting.set({ ...Setting.item, opacity });
  }

  static get options() {
    return Setting.item.options;
  }

  static set options(options: ISetting["options"]) {
    Setting.set({ ...Setting.item, options });
  }

  static get bookmarks() {
    return Setting.item.bookmarks;
  }

  static set bookmarks(bookmarks: ISetting["bookmarks"]) {
    Setting.set({ ...Setting.item, bookmarks });
  }

  static get searchengines() {
    return Setting.item.searchengines;
  }

  static set searchengines(searchengins: ISetting["searchengines"]) {
    Setting.set({ ...Setting.item, searchengines: searchengins });
  }
}
