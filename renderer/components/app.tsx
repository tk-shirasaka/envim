import React, { ChangeEvent } from "react";

import { Emit } from "../utils/emit";
import { Localstorage } from "../utils/localstorage";
import { SettingComponent } from "./setting";
import { EnvimComponent } from "./envim";

interface Props {
}

interface States {
  init: boolean;
  resize: boolean;
  opacity: number;
  window: { width: number; height: number; };
}

export class AppComponent extends React.Component<Props, States> {
  private timer: number = 0;
  private ls: Localstorage<number> = new Localstorage<number>("opacity", 0);

  constructor(props: Props) {
    super(props);
    this.state = { init: false, resize: false, opacity: this.ls.get(), window: {width: window.innerWidth, height: window.innerHeight} };

    window.addEventListener("resize", this.onResize.bind(this));
    Emit.on("app:start", this.onStart.bind(this));
    Emit.on("app:stop", this.onStop.bind(this));
  }

  private onResize() {
    const timer = +setTimeout(() => {
      this.setState({ resize: timer !== this.timer });
    }, 200);
    this.timer = timer;
    this.setState({ window: { width: window.innerWidth, height: window.innerHeight } });
  }

  private onStart() {
    this.setState({ init: true });
  }

  private onStop() {
    this.setState({ init: false });
  }

  private onChangeOpacity(e: ChangeEvent) {
    const opacity = +(e.target as HTMLInputElement).value;
    this.ls.set(opacity);
    this.setState({ opacity });
  }

  private renderContent() {
    if (this.state.resize) return null;
    return this.state.init
      ? <EnvimComponent {...this.state.window} />
      : <SettingComponent opacity={this.state.opacity} onChangeOpacity={this.onChangeOpacity.bind(this)} />;
  }

  render() {
    const opacity = 100 - this.state.opacity;
    return (
      <div style={{ ...this.state.window, opacity: opacity / 100 }}>{this.renderContent()}</div>
    )
  }
}
