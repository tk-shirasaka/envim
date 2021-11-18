import React from "react";

import { Emit } from "../utils/emit";
import { x2Col, col2X } from "../utils/size";

import { SidebarComponent } from "./sidebar";
import { SettingComponent } from "./setting";
import { EnvimComponent } from "./envim";

interface Props {
}

interface States {
  init: boolean;
  window: { width: number; height: number; };
}

export class AppComponent extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);
    this.state = { init: false, window: { width: window.innerWidth, height: window.innerHeight } };

    window.addEventListener("resize", this.onResize.bind(this));
    (document as any).fonts.load("10px Editor Regular").then();
    (document as any).fonts.load("10px Editor Bold").then();
    Emit.on("app:start", this.onStart.bind(this));
    Emit.on("app:stop", this.onStop.bind(this));
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
