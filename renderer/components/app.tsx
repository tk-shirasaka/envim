import React, { ChangeEvent } from "react";
import { ipcRenderer } from "electron";

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

    ipcRenderer.on("app:start", this.onStart.bind(this));
    ipcRenderer.on("app:stop", this.onStop.bind(this));
    window.addEventListener("beforeunload", this.onStop.bind(this));
  }

  private onChangeFont(e: ChangeEvent) {
    const target = e.target as HTMLInputElement;
    const font = Object.assign({}, this.state.font);

    switch (target.name) {
      case "width":
        font.width = +target.value;
      break;
      case "size":
        font.size = +target.value;
        font.height = font.size + 1;
      break;
    }
    this.ls.set(font);
    this.setState({ font });
  }

  private onStart() {
    this.setState({ init: true });
  }

  private onStop() {
    ipcRenderer.send("envim:detach");
    this.setState({ init: false });
  }

  render() {
    return this.state.init
      ? <EnvimComponent font={this.state.font} />
      : <SettingComponent font={this.state.font} onChangeFont={this.onChangeFont.bind(this)} />;
  }
}
