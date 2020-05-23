import { Localstorage } from "./localstorage";
import { Emit } from "./emit";

interface ISetting {
  type: "command" | "address";
  path: string;
  font: { size: number; width: number; height: number; };
  opacity: number;
  options: { [k: string]: boolean; };
  others: { [k: string]: boolean; };
}

const defaultSetting: ISetting = {
  type: "command",
  path: "",
  font: { size: 16, width: 8, height: 17 },
  opacity: 0,
  options: { ext_multigrid: true, ext_cmdline: true, ext_tabline: true, ext_popupmenu: true, ext_messages: true },
  others: { notify: true },
};

const ls: Localstorage<ISetting> = new Localstorage<ISetting>("setting", defaultSetting);

export class Setting {
  private static item: ISetting = ls.get();

  static get() {
    return Setting.item;
  }

  private static set(item: ISetting, key: string = "") {
    Setting.item = item;
    ls.set(Setting.item);
    key && Emit.share(`setting:${key}`);
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
    Setting.set({ ...Setting.item, font }, "font");
  }

  static get opacity() {
    return Setting.item.opacity;
  }

  static set opacity(opacity: ISetting["opacity"]) {
    Setting.set({ ...Setting.item, opacity }, "opacity");
  }

  static get options() {
    return Setting.item.options;
  }

  static set options(options: ISetting["options"]) {
    Setting.set({ ...Setting.item, options });
  }

  static get others() {
    return Setting.item.others;
  }

  static set others(others: ISetting["others"]) {
    Setting.set({ ...Setting.item, others }, "others");
  }
}
