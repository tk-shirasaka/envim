import { ipcRenderer, IpcRendererEvent } from "electron";
import { EventEmitter } from "events";

export class Emit {
  private static emit = new EventEmitter;

  static on(event: string, callback: (...args: any[]) => void) {
    Emit.emit.on(event, callback);
    ipcRenderer.on(event, (_: IpcRendererEvent, ...args: any[]) => Emit.share(event, ...args));
  }

  static share(event: string, ...args: any[]) {
    Emit.emit.emit(event, ...args);
  }

  static send(event: string, ...args: any[]) {
    ipcRenderer.send(event, ...args);
  }

  static clear(events: string[]) {
    events.forEach(event => Emit.emit.removeAllListeners(event));
  }
}
