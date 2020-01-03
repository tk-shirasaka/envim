import React, { ChangeEvent } from "react";
import { ipcRenderer } from "electron";

import { SettingComponent } from "./setting";
import { EnvimComponent } from "./envim";

import { Localstorage } from "../utils/localstorage";
import { IFont, Font } from "../utils/interfaces";

interface Props {
}

interface States {
  init: boolean;
  font: IFont;
}

export class AppComponent extends React.Component<Props, States> {
  private ls: Localstorage<IFont> = new Localstorage<IFont>("font", new Font);

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
