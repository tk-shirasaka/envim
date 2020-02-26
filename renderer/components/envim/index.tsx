import React from "react";

import { Emit } from "../../utils/emit";

import { TablineComponent } from "./tabline";
import { EditorComponent } from "./editor";
import { HistoryComponent } from "./history";
import { CmdlineComponent } from "./cmdline";
import { PopupmenuComponent } from "./popupmenu";
import { NotificateComponent } from "./notificate";
import { InputComponent } from "./input";

interface Props {
  window: { width: number; height: number; };
  font: { width: number; height: number; size: number; };
}

interface States {
}

const position: "relative" = "relative"
const style = {
  position,
  overflow: "hidden",
};

export class EnvimComponent extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);

    Emit.on("envim:title", this.onTitle.bind(this));
  }

  private onTitle(title: string) {
    document.title = title || 'Envim';
  }

  render() {
    const { height } = this.props.font;
    const editor = { width: this.props.window.width, height: Math.floor((this.props.window.height - height - 4) / height) * height };
    const header = { width: this.props.window.width, height: this.props.window.height - editor.height };
    const footer = { width: this.props.window.width, height: Math.min(editor.height, height * 15) };

    return (
      <>
        <TablineComponent {...header} />
        <div style={{...style, ...editor}}>
          <EditorComponent {...editor} />
          <HistoryComponent {...footer} />
          <CmdlineComponent {...footer} />
          <PopupmenuComponent />
          <NotificateComponent />
        </div>
        <InputComponent />
      </>
    );
  }
}
