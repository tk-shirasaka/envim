import React from "react";

import { Emit } from "../utils/emit";
import { Setting } from "../utils/setting";

import { SettingComponent } from "./setting";
import { EnvimComponent } from "./envim";

interface Props {
}

interface States {
  init: boolean;
  theme: "dark" | "light";
  window: { width: number; height: number; };
}

export class AppComponent extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);
    this.state = { init: false, theme: "dark", window: { width: window.innerWidth, height: window.innerHeight } };

    window.addEventListener("resize", this.onResize);
    (document as any).fonts.load("10px Editor Regular").then();
    (document as any).fonts.load("10px Editor Bold").then();
    (document as any).fonts.load("10px Icon").then();
    Emit.on("app:switch", this.onSwitch);
    Emit.on("app:theme", this.onTheme);
  }

  private onResize = () => {
    this.setState({ window: { width: window.innerWidth, height: window.innerHeight } });
  }

  private onSwitch = (init: boolean) => {
    if (this.state.init === init) return;

    Setting.saveCache();
    Emit.send("envim:setting", Setting.get());
    this.setState({ init });
  }

  private onTheme = (theme: "dark" | "light") => {
    this.setState({ theme });
  }

  render() {
    return (
      <div className={`theme-${this.state.theme}`}>
        {this.state.init
          ? <EnvimComponent {...this.state.window} />
          : <SettingComponent {...this.state.window} />
        }
      </div>
    );
  }
}
