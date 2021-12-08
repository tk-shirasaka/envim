import { ipcMain, IpcMainInvokeEvent } from "electron";
import { EventEmitter } from "events";

import { Browser } from "./browser";

export class Emit {
  private static emit = new EventEmitter;

  static on(event: string, callback: (...args: any[]) => void) {
    Emit.emit.on(event, callback);
    ipcMain.handle(event, (_: IpcMainInvokeEvent, ...args: any[]) => Emit.share(event, ...args));
  }

  static share(event: string, ...args: any[]) {
    return Emit.emit
      .listeners(event)
      .map(callback => callback(...args))
      .find(result => result);
  }

  static send(event: string, ...args: any[]) {
    Browser.win?.webContents.send(event, ...args);
  }

  static clear(events: string[]) {
    events.forEach(event => {
      Emit.emit.removeAllListeners(event);
      ipcMain.removeAllListeners(event);
    });
  }
}
