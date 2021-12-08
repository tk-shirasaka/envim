declare global {
  interface Window {
    envimIPC: {
      on: (event: string, callback: (...args: any[]) => void) => void,
      share: (event: string, ...args: any[]) => void,
      send: <T>(event: string, ...args: any[]) => Promise<T>,
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

  static send<T>(event: string, ...args: any[]): Promise<T> {
    return window.envimIPC.send<T>(event, ...args);
  }

  static clear(events: string[]) {
    window.envimIPC.clear(events);
  }
}
