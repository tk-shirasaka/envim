import React from "react";

import { IHighlight } from "common/interface";

import { Emit } from "../../utils/emit";
import { Highlights } from "../../utils/highlight";

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
  background: string;
  color: string;
  borderColor: string;
}

const position: "relative" = "relative"
const style = {
  position,
  overflow: "hidden",
};

export class EnvimComponent extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);

    this.state = { background: "", color: "", borderColor: "" };
    Emit.on("envim:highlights", this.onHighlight.bind(this));
    Emit.on("envim:title", this.onTitle.bind(this));
  }

  private onHighlight(highlights: {id: number, hl: IHighlight}[]) {
    highlights.forEach(({id, hl}) => {
      Highlights.setHighlight(id, hl);

      if (id === 0) {
        const style = Highlights.style(id);
        JSON.stringify(this.state) === JSON.stringify(style) || this.setState(style);
      }
    });
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
      <div style={this.state}>
        <TablineComponent {...header} />
        <div style={{...style, ...editor}}>
          <EditorComponent {...editor} />
          <HistoryComponent {...footer} />
          <CmdlineComponent {...footer} />
          <PopupmenuComponent />
          <NotificateComponent />
        </div>
        <InputComponent />
      </div>
    );
  }
}
