import { app } from "electron";
import { join } from "path";
import { existsSync, readFileSync, writeFileSync } from "fs";

import { ISetting } from "common/interface";

export class Setting {
  private static item: ISetting
  private static init: boolean = false;
  private static path: string = join(app.getPath("appData"), "envim.json");

  static set(item: ISetting) {
    Setting.init = true;
    Setting.item = item

    writeFileSync(Setting.path, JSON.stringify(item), { encoding: "utf8" });
  }
  static get() {
    if (Setting.init === false && existsSync(Setting.path)) {
      const item = readFileSync(Setting.path, { encoding: "utf8" });

      Setting.item = JSON.parse(item);
      Setting.init = true;
    }

    return Setting.item;
  }
}
