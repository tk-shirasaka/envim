import React from "react";

import { Emit } from "../utils/emit";

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
    return this.state.init
      ? <EnvimComponent {...this.state.window} />
      : <SettingComponent {...this.state.window} />;
  }
}
