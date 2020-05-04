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
  style: { background: string; color: string; borderColor: string; };
  options: { [k: string]: boolean };
}

const position: "relative" = "relative"
const style = {
  position,
  overflow: "hidden",
};

export class EnvimComponent extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);

    this.state = { style: { background: "", color: "", borderColor: "" }, options: {} };
    Emit.on("highlight:set", this.onHighlight.bind(this));
    Emit.on("highlight:name", this.onHlGroup.bind(this));
    Emit.on("envim:title", this.onTitle.bind(this));
    Emit.on("envim:option", this.onOption.bind(this));
  }

  componentWillUnmount() {
    Emit.clear(["highlight:set", "highlight:name", "envim:title", "envim:option"]);
  }

  private onHighlight(highlights: {id: number, hl: IHighlight}[]) {
    highlights.forEach(({id, hl}) => {
      Highlights.setHighlight(id, hl);

      if (id === 0) {
        const style = Highlights.style(id);
        JSON.stringify(this.state.style) === JSON.stringify(style) || this.setState({ style });
      }
    });
  }

  private onHlGroup(groups: {id: number, name: string}[]) {
    groups.forEach(({id, name}) => Highlights.setName(id, name));
  }

  private onTitle(title: string) {
    document.title = title || 'Envim';
  }

  private onOption(options: { [k: string]: boolean }) {
    this.setState({ options: Object.assign(options, this.state.options) });
  }

  render() {
    const { height } = this.props.font;
    const { width } = this.props.window;
    const header = { width, height: this.state.options.ext_tabline ? height + 4 + (this.props.window.height - 4) % height : 0 };
    const editor = { width, height: this.props.window.height - header.height };
    const footer = { width, height: Math.min(editor.height, height * 15) };

    return (
      <div style={this.state.style}>
        { this.state.options.ext_tabline ? <TablineComponent {...header} /> : null }
        <div style={{...style, ...editor}}>
          <EditorComponent {...editor} />
          { this.state.options.ext_messages ? <HistoryComponent {...footer} /> : null }
          { this.state.options.ext_cmdline ? <CmdlineComponent /> : null }
          { this.state.options.ext_popupmenu ? <PopupmenuComponent /> : null }
          { this.state.options.ext_messages ? <NotificateComponent /> : null }
        </div>
        <InputComponent />
      </div>
    );
  }
}
