import React from "react";

import { Emit } from "../utils/emit";
import { Setting } from "../utils/setting";
import { SettingComponent } from "./setting";
import { EnvimComponent } from "./envim";

interface Props {
}

interface States {
  init: boolean;
  resize: boolean;
  font: { width: number; height: number; size: number; };
  window: { width: number; height: number; };
}

export class AppComponent extends React.Component<Props, States> {
  private timer: number = 0;

  constructor(props: Props) {
    super(props);
    this.state = { ...Setting.get(), init: false, resize: false, window: { width: window.innerWidth, height: window.innerHeight } };

    window.addEventListener("resize", this.onResize.bind(this));
    Emit.on("app:start", this.onStart.bind(this));
    Emit.on("app:stop", this.onStop.bind(this));
    Emit.on("setting:font", this.onFont.bind(this));
  }

  private onResize() {
    this.timer && clearTimeout(this.timer)
    this.timer = +setTimeout(() => {
      this.setState({ resize: false });
      this.timer = 0;
    }, 200);
    this.setState({ resize: true, window: { width: window.innerWidth, height: window.innerHeight } });
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

  private renderContent() {
    if (this.state.resize) return null;
    return this.state.init
      ? <EnvimComponent {...this.state} />
      : <SettingComponent />;
  }

  render() {
    const style = {
      fontSize: this.state.font.size,
      lineHeight: `${this.state.font.height}px`,
    };

    return <div style={{ ...this.state.window, ...style }}>{this.renderContent()}</div>;
  }
}
