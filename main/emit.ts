import { ipcMain, IpcMainInvokeEvent } from "electron";
import { EventEmitter } from "events";

import { Bootstrap } from "./bootstrap";

export class Emit {
  private static emit = new EventEmitter;
  private static events: { [k: string]: ((...args: any[]) => void)[] } = {};
  private static cache: { [k: string ]: { json: string; timer: number; } } = {};

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

  static once(event: string, callback: (...args: any[]) => void) {
    const wrap = (...args: any[]) => {
      Emit.off(event, wrap);
      callback(...args);
    };

    Emit.on(event, wrap);
  }

  static async share(event: string, ...args: any[]) {
    return Emit.events[event]
      .map(callback => callback(...args))
      .find(result => result);
  }

  static send(event: string, ...args: any[]) {
    Bootstrap.win?.webContents.send(event, ...args);
  }

  static update(event: string, async: boolean, ...args: any[]) {
    const json = JSON.stringify(args);
    const cache = Emit.cache[event] || { json: "", timer: 0 };

    if (cache.json !== json) {
      cache.json = json;
      cache.timer || Emit.send(event, ...args);

      if (async && cache.timer === 0) {
        cache.timer = +setTimeout(() => {
          cache.timer = 0;
          cache.json === json || Emit.send(event, ...JSON.parse(cache.json));
        }, 200);
      }

      Emit.cache[event] = cache;
    }
  }

  static off(event: string, callback: (...args: any[]) => void) {
    Emit.events[event] = Emit.events[event]?.filter(stored => callback !== stored) || [];
  }
}
