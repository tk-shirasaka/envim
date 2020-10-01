import React from "react";

import { Emit } from "../utils/emit";
import { Setting } from "../utils/setting";
import { x2Col, col2X } from "../utils/size";

import { SidebarComponent } from "./sidebar";
import { SettingComponent } from "./setting";
import { EnvimComponent } from "./envim";

interface Props {
}

interface States {
  init: boolean;
  font: { width: number; height: number; size: number; };
  window: { width: number; height: number; };
}

export class AppComponent extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);
    this.state = { ...Setting.get(), init: false, window: { width: window.innerWidth, height: window.innerHeight } };

    window.addEventListener("resize", this.onResize.bind(this));
    Emit.on("app:start", this.onStart.bind(this));
    Emit.on("app:stop", this.onStop.bind(this));
    Emit.on("setting:font", this.onFont.bind(this));
  }

  private getSize() {
    const side = { width: 0, height: this.state.window.height };
    const main = { width: 0, height: this.state.window.height };

    main.width = col2X(x2Col(this.state.window.width) - 3);
    side.width = this.state.window.width - main.width;

    return { side, main };
  }

  private onResize() {
    this.setState({ window: { width: window.innerWidth, height: window.innerHeight } });
  }

  private onStart() {
    this.setState({ init: true });
  }

  private onStop() {
    this.setState({ init: false });
  }

  private onFont() {
    const font = Setting.font;
    this.setState({ font });
  }

  render() {
    const { main, side } = this.getSize();

    return (
      <div style={{ ...this.state.window, display: "flex" }}>
        <SidebarComponent side={side} />
        { this.state.init
            ? <EnvimComponent {...main} />
            : <SettingComponent {...main} />
        }
      </div>
    );
  }
}
