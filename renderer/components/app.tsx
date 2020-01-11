import React from "react";
import { ipcRenderer } from "electron";

import { Emit } from "../utils/emit";
import { Localstorage } from "../utils/localstorage";

import { SettingComponent } from "./setting";
import { EnvimComponent } from "./envim";

interface Props {
}

interface States {
  init: boolean;
  font: { size: number; width: number; height: number; };
}

export class AppComponent extends React.Component<Props, States> {
  private ls: Localstorage<States["font"]> = new Localstorage<States["font"]>("font", { size: 16, width: 8, height: 17 });

  constructor(props: Props) {
    super(props);
    this.state = { init: false, font: this.ls.get() };

    Emit.on("menu:zoom-in", this.onZoomIn.bind(this));
    Emit.on("menu:zoom-out", this.onZoomOut.bind(this));
    ipcRenderer.on("app:start", this.onStart.bind(this));
    ipcRenderer.on("app:stop", this.onStop.bind(this));
  }

  private zoom(offset: number) {
    const font = Object.assign({}, this.state.font);

    font.size += offset
    font.width = font.size / 2;
    font.height = font.size + 1;
    this.ls.set(font);
    this.setState({ font });
  }

  private onZoomIn() {
    this.zoom(1);
  }

  private onZoomOut() {
    this.zoom(-1);
  }

  private onStart() {
    this.setState({ init: true });
  }

  private onStop() {
    this.setState({ init: false });
  }

  render() {
    return this.state.init
      ? <EnvimComponent font={this.state.font} />
      : <SettingComponent />;
  }
}
