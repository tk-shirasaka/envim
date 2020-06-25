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
  resize: boolean;
  font: { width: number; height: number; size: number; };
  window: { width: number; height: number; };
  options: { [k: string]: boolean };
  mouse: boolean;
}

export class AppComponent extends React.Component<Props, States> {
  private timer: number = 0;

  constructor(props: Props) {
    super(props);
    this.state = { ...Setting.get(), init: false, resize: false, window: { width: window.innerWidth, height: window.innerHeight }, options: {}, mouse: false };

    window.addEventListener("resize", this.onResize.bind(this));
    Emit.on("app:start", this.onStart.bind(this));
    Emit.on("app:stop", this.onStop.bind(this));
    Emit.on("setting:font", this.onFont.bind(this));
    Emit.on("envim:mouse", this.onMouse.bind(this));
    Emit.on("envim:option", this.onOption.bind(this));
  }

  private getSize() {
    const side = { width: 0, height: this.state.window.height };
    const main = { width: 0, height: this.state.window.height };

    main.width = col2X(x2Col(this.state.window.width) - 3);
    side.width = this.state.window.width - main.width;

    return { side, main };
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
    this.setState({ init: false, mouse: false, options: {} });
  }

  private onFont() {
    const font = Setting.font;
    this.setState({ font });
  }

  private onMouse(mouse: boolean) {
    this.setState({ mouse });
  }

  private onOption(options: { [k: string]: boolean }) {
    this.setState({ options: Object.assign(options, this.state.options) });
  }

  private renderContent() {
    const { main } = this.getSize();

    if (this.state.resize) return <div className="color-black" style={this.state.window}></div>;
    return this.state.init
      ? <EnvimComponent main={main} {...this.state} />
      : <SettingComponent {...main} />;
  }

  render() {
    const { side } = this.getSize();

    return (
      <div style={{ ...this.state.window, display: "flex" }}>
        <SidebarComponent side={side} />
        {this.renderContent()}
      </div>
    );
  }
}
