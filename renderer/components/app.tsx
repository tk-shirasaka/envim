import React, { ChangeEvent } from "react";

import { font } from "../utils/font";
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
  font: { width: number; height: number; size: number; };
}

export class AppComponent extends React.Component<Props, States> {
  private timer: number = 0;
  private ls: Localstorage<number> = new Localstorage<number>("opacity", 0);

  constructor(props: Props) {
    super(props);
    this.state = {
      init: false,
      resize: false,
      opacity: this.ls.get(),
      window: { width: window.innerWidth, height: window.innerHeight },
      font: font.get(),
    };

    window.addEventListener("resize", this.onResize.bind(this));
    Emit.on("app:start", this.onStart.bind(this));
    Emit.on("app:stop", this.onStop.bind(this));
    Emit.on("app:zoom-in", this.onZoomIn.bind(this));
    Emit.on("app:zoom-out", this.onZoomOut.bind(this));
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

  private zoom(offset: number) {
    const { size } = font.get();
    const next = { size: size + offset, width: (size + offset) / 2, height: size + offset + 1 };

    font.set(next);
    this.setState({ font: next });
  }

  private onZoomIn() {
    this.zoom(1);
  }

  private onZoomOut() {
    this.zoom(-1);
  }

  private onChangeOpacity(e: ChangeEvent) {
    const opacity = +(e.target as HTMLInputElement).value;
    this.ls.set(opacity);
    this.setState({ opacity });
  }

  private renderContent() {
    if (this.state.resize) return null;
    return (
      <div style={{ fontSize: this.state.font.size }}>
        {this.state.init
          ? <EnvimComponent {...this.state} />
          : <SettingComponent opacity={this.state.opacity} onChangeOpacity={this.onChangeOpacity.bind(this)} />}
      </div>
    );
  }

  render() {
    const opacity = 100 - this.state.opacity;
    return (
      <div style={{ ...this.state.window, opacity: opacity / 100 }}>{this.renderContent()}</div>
    )
  }
}
