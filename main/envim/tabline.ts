import { ITab, IBuffer } from "common/interface";

import { Emit } from "../emit";

export class Tablines {
  private static tabs: ITab[] = [];
  private static bufs: IBuffer[] = [];
  private static dirty: boolean = false;

  static init() {
    Tablines.tabs = [];
    Tablines.bufs = [];
  }

  static settabs(tabs: ITab[]) {
    const update = JSON.stringify(Tablines.tabs) !== JSON.stringify(tabs);

    if (update) {
      Tablines.dirty = true;
      Tablines.tabs = tabs;
    }
  }

  static setbufs(bufs: IBuffer[]) {
    const update = JSON.stringify(Tablines.bufs) !== JSON.stringify(bufs);

    if (update) {
      Tablines.dirty = true;
      Tablines.bufs = bufs;
    }
  }

  static flush() {
    Tablines.dirty && Emit.send("tabline:update", Tablines.tabs, Tablines.bufs);
    Tablines.dirty = false;
  }
}
