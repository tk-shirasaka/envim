import React from "react";

import { Emit } from "../utils/emit";
import { Setting } from "../utils/setting";
import { Highlights } from "../utils/highlight";
import { Cache } from "../utils/cache";
import { y2Row, x2Col, row2Y, col2X } from "../utils/size";

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
    (document as any).fonts.load("10px Git").then();
    Emit.on("app:switch", this.onSwitch);
    Emit.on("app:theme", this.onTheme);
    Highlights.setHighlight("0", true, {  })
  }

  private onResize = () => {
    this.setState(() => ({ window: { width: window.innerWidth, height: window.innerHeight } }));
  }

  private onSwitch = (init: boolean) => {
    this.setState(state => {
      Emit.initialize();

      state.init === init || Emit.send("envim:setting", Setting.get());

      return { init };
    });
  }

  private onTheme = (theme: "dark" | "light") => {
    this.setState(() => ({ theme }));
    Cache.set<"dark" | "light">("common", "theme", theme);
  }

  render() {
    const titlebar = navigator.windowControlsOverlay.getTitlebarAreaRect
      ? navigator.windowControlsOverlay.getTitlebarAreaRect()
      : { x: 0, y: 0, width: 0, height: 0, left: 0, right: 0 };
    const header = {
      width: titlebar.width + titlebar.left,
      height: Math.min(row2Y(2), (titlebar.y * 2) + titlebar.height || row2Y(2)),
      paddingLeft: titlebar.left || 0,
    };
    const main = {
      width: col2X(x2Col(this.state.window.width) - 2),
      height: row2Y(y2Row(this.state.window.height - header.height - row2Y(1) - 4) - 1),
    };
    const footer = { width: this.state.window.width, height: this.state.window.height - header.height - main.height - row2Y(1) };

    return (
      <div className={`theme-${this.state.theme}`}>
        {this.state.init
          ? <EnvimComponent { ...{ header, main, footer } } />
          : <SettingComponent {...this.state.window} />
        }
      </div>
    );
  }
}
