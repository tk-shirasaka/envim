import React from "react";

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
    this.onResize = this.onResize.bind(this);
    window.addEventListener("resize", this.onResize);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.onResize);
  }

  private onResize() {
    const timer = +setTimeout(() => {
      if (timer !== this.timer) return;

      this.setState({ width: window.innerWidth, height: window.innerHeight });
    }, 200);
    this.timer = timer;
  }

  render() {
    return (
      <>
        <CanvasComponent font={this.props.font} win={this.state} />
        <InputComponent />
        <MenuComponent />
      </>
    );
  }
}
