declare global {
  interface Window {
    envimIPC: {
      on: (event: string, callback: (...args: any[]) => void) => void,
      share: (event: string, ...args: any[]) => void,
      send: (event: string, ...args: any[]) => void,
      clear: (events: string[]) => void,
    }
  }
}

export class Emit {
  static on(event: string, callback: (...args: any[]) => void) {
    window.envimIPC.on(event, callback);
  }

  static share(event: string, ...args: any[]) {
    window.envimIPC.share(event, ...args);
  }

  static send(event: string, ...args: any[]) {
    window.envimIPC.send(event, ...args);
  }

  static clear(events: string[]) {
    window.envimIPC.clear(events);
  }
}
