import React from "react";
import ReactDom from "react-dom";

import "../styles/index.scss";

import { AppComponent } from "./app";

declare global {
  interface Window {
    envimIPC: {
      on: (event: string, callback: (...args: any[]) => void) => void,
      send: <T>(event: string, ...args: any[]) => Promise<T>,
    }
  }

  interface Navigator {
    windowControlsOverlay: {
      getBoundingClientRect?: () => DOMRect,
    }
  }
}

ReactDom.render(<AppComponent />, document.getElementById("app"));
