import React from "react";
import ReactDom from "react-dom";

import { AppComponent } from "./app";

declare global {
  interface Window {
    envimIPC: {
      on: (event: string, callback: (...args: any[]) => void) => void,
      share: (event: string, ...args: any[]) => void,
      send: <T>(event: string, ...args: any[]) => Promise<T>,
      clear: (events: string[]) => void,
    }
  }

  interface Navigator {
    windowControlsOverlay: {
      getTitleBarAreaRect?: () => DOMRect,
    }
  }
}

ReactDom.render(<AppComponent />, document.getElementById("app"));
