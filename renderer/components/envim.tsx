import React from "react";
import { EventEmitter } from "events";

import { CanvasComponent } from "./canvas";
import { InputComponent } from "./input";

interface Props {
  font: { size: number; width: number; height: number; };
}

interface States {
  width: number;
  height: number;
}

export class EnvimComponent extends React.Component<Props, States> {
  private timer: number = 0;
  private emit = new EventEmitter;

  constructor(props: Props) {
    super(props);

    this.state = { width: window.innerWidth, height: window.innerHeight };
    window.addEventListener("resize", this.onResize.bind(this));
  }

  private onResize() {
    const timer = +setTimeout(() => {
      if (timer !== this.timer) return;

      this.setState({ width: window.innerWidth, height: window.innerHeight })
    }, 200);
    this.timer = timer;
  }

  render() {
    return (
      <>
        <CanvasComponent font={this.props.font} win={{ width: this.state.width, height: this.state.height }} emit={this.emit} />
        <InputComponent emit={this.emit} />
      </>
    );
  }
}
