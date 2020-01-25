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
  header: { width: number, height: number; };
  editor: { width: number, height: number; };
  cmdline: { width: number, height: number; };
  history: { width: number, height: number; };
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
    const font = this.props.font;
    const editor = { width: win.width, height: win.height - font.height - 8 };
    const header = { width: win.width, height: win.height - editor.height };
    const cmdline = { width: Math.floor(win.width * 0.8 / font.width) * font.width, height: font.height * 15 };
    const history = { width: win.width, height: font.height * 15 };

    return { header, editor, cmdline, history };
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
        <TablineComponent font={this.props.font} win={this.state.header} />
        <div style={{...style, ...this.state.editor}}>
          <EditorComponent font={this.props.font} win={this.state.editor} />
          <CmdlineComponent font={this.props.font} win={this.state.cmdline} />
          <HistoryComponent font={this.props.font} win={this.state.history} />
          <PopupmenuComponent font={this.props.font} />
          <MessageComponent font={this.props.font} />
        </div>
        <InputComponent />
        <MenuComponent />
      </>
    );
  }
}
