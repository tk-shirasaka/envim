import React, { MouseEvent } from "react";

import { Emit } from "../utils/emit";

import { CanvasComponent } from "./canvas";
import { InputComponent } from "./input";
import { MenuComponent } from "./menu";

interface Props {
  font: { size: number; width: number; height: number; };
}

interface States {
  width: number;
  height: number;
}

export class EnvimComponent extends React.Component<Props, States> {
  private timer: number = 0;

  constructor(props: Props) {
    super(props);

    this.state = { width: window.innerWidth, height: window.innerHeight };
    window.addEventListener("resize", this.onResize.bind(this));
  }

  private onResize() {
    const timer = +setTimeout(() => {
      if (timer !== this.timer) return;

      this.setState({ width: window.innerWidth, height: window.innerHeight });
    }, 200);
    this.timer = timer;
  }

  private onMenu(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    Emit.send("menu:on", e.clientY, e.clientX);
  }

  render() {
    return (
      <div onContextMenu={this.onMenu.bind(this)}>
        <CanvasComponent font={this.props.font} win={this.state} />
        <InputComponent />
        <MenuComponent />
      </div>
    );
  }
}
