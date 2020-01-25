import React from "react";

import { TablineComponent } from "./tabline";
import { EditorComponent } from "./editor";
import { CmdlineComponent } from "./cmdline";
import { PopupmenuComponent } from "./popupmenu";
import { MessageComponent } from "./message";
import { HistoryComponent } from "./history";
import { InputComponent } from "./input";
import { MenuComponent } from "./menu";

interface Props {
  font: { size: number; width: number; height: number; };
}

interface States {
  tab: { width: number, height: number; };
  canvas: { width: number, height: number; };
}

const position: "relative" = "relative"
const style = {
  position,
  overflow: "hidden",
};

export class EnvimComponent extends React.Component<Props, States> {
  private timer: number = 0;

  constructor(props: Props) {
    super(props);

    this.state = this.newState();
    this.onResize = this.onResize.bind(this);
    window.addEventListener("resize", this.onResize);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.onResize);
  }

  private newState() {
    const win = { width: window.innerWidth, height: window.innerHeight };
    const canvas = { width: win.width, height: win.height - this.props.font.height - 8 };
    const tab = { width: win.width, height: win.height - canvas.height };

    return { tab, canvas };
  }

  private onResize() {
    const timer = +setTimeout(() => {
      if (timer !== this.timer) return;

      this.setState(this.newState());
    }, 200);
    this.timer = timer;
  }

  render() {
    return (
      <>
        <TablineComponent font={this.props.font} win={this.state.tab} />
        <div style={{...style, ...this.state.canvas}}>
          <EditorComponent font={this.props.font} win={this.state.canvas} />
          <CmdlineComponent font={this.props.font} win={this.state.canvas} />
          <PopupmenuComponent font={this.props.font} />
          <MessageComponent font={this.props.font} />
          <HistoryComponent font={this.props.font} />
        </div>
        <InputComponent />
        <MenuComponent />
      </>
    );
  }
}
