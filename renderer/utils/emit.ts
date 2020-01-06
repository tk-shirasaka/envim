import { EventEmitter } from "events";

export class Emit {
  private static emit = new EventEmitter;

  static on(event: string, callback: (...args: any[]) => void) {
    Emit.emit.on(event, callback);
  }

  static send(event: string, ...args: any[]) {
    Emit.emit.emit(event, ...args);
  }
}
