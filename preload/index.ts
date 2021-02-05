import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import { EventEmitter } from "events";

const emit = new EventEmitter;

const on = (event: string, callback: (...args: any[]) => void) => {
  emit.on(event, callback);
  ipcRenderer.on(event, (_: IpcRendererEvent, ...args: any[]) => share(event, ...args));
  ipcRenderer.on(event, (_: IpcRendererEvent, ...args: any[]) => share("debug", event, ...args));
};

const share = (event: string, ...args: any[]) => {
  emit.emit(event, ...args);
};

const send = (event: string, ...args: any[]) => {
  ipcRenderer.invoke(event, ...args);
};

const clear = (events: string[]) => {
  events.forEach(event => {
    emit.removeAllListeners(event);
    ipcRenderer.removeAllListeners(event);
  });
};

contextBridge.exposeInMainWorld("envimIPC", { on, share, send, clear });
