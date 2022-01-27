import { ipcMain, IpcMainInvokeEvent } from "electron";
import { EventEmitter } from "events";

import { Browser } from "./browser";

export class Emit {
  private static emit = new EventEmitter;
  private static events: { [k: string]: ((...args: any[]) => void)[] } = {};
  private static cache: { [k: string ]: string } = {};

  static init() {
    Emit.cache = {};
  }

  static on(event: string, callback: (...args: any[]) => void) {
    if (!Emit.events[event]) {
      ipcMain.handle(event, (_: IpcMainInvokeEvent, ...args: any[]) => Emit.share(event, ...args));
      Emit.emit.on(event, (...args) => Emit.share(event, ...args));
      Emit.events[event] = [];
    }

    Emit.events[event].push(callback);
  }

  static share(event: string, ...args: any[]) {
    return Emit.events[event]
      .map(callback => callback(...args))
      .find(result => result);
  }

  static send(event: string, ...args: any[]) {
    Browser.win?.webContents.send(event, ...args);
  }

  static update(event: string, ...args: any[]) {
    const json = JSON.stringify(args);

    if (Emit.cache[event] !== json) {
      Emit.cache[event] = json;
      Emit.send(event, ...args);
    }
  }

  static off(event: string, callback: (...args: any[]) => void) {
    Emit.events[event] = Emit.events[event]?.filter(stored => callback !== stored) || [];
  }
}
