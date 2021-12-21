import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import { EventEmitter } from "events";

const emit = new EventEmitter;
const counter: number[] = [];

const on = (event: string, callback: (...args: any[]) => void) => {
  emit.on(event, callback);
  ipcRenderer.on(event, (_: IpcRendererEvent, ...args: any[]) => {
    counter.length && share("envim:pause", false);
    share(event, ...args);
    share("debug", event, ...args);
  });
};

const share = (event: string, ...args: any[]) => {
  emit.emit(event, ...args);
};

const invoke = async (event: string, ...args: any[]) => {
  try {
    return await ipcRenderer.invoke(event, ...args);
  } catch (e: Error | any) {
    const reg = /^Error invoking remote method '[^']+': /;
    const contents: { hl: string, content: string }[] = [];
    if (e instanceof Error) {
      contents.push({ hl: "red", content: e.message.replace(reg, "")});
    } else if (e instanceof String) {
      contents.push({ hl: "red", content: e.toString().replace(reg, "")});
    }

    contents.length && share("messages:show", { kind: "debug", contents }, true);
  }
};

const send = async (event: string, ...args: any[]) => {
  const timer = +setTimeout(() => {
    counter.push(timer);
    share("envim:pause", true)
  }, 100);

  const result = await invoke(event, ...args);
  const index = counter.indexOf(timer)
  clearTimeout(timer);
  index >= 0 && counter.splice(index, 1) && counter.length === 0 && share("envim:pause", false);

  return result;
};

const clear = (events: string[]) => {
  events.forEach(event => {
    emit.removeAllListeners(event);
    ipcRenderer.removeAllListeners(event);
  });
};

contextBridge.exposeInMainWorld("envimIPC", { on, share, send, clear });
