import React from "react";

import { Emit } from "../../utils/emit";
import { font } from "../../utils/font";

import { TablineComponent } from "./tabline";
import { EditorComponent } from "./editor";
import { HistoryComponent } from "./history";
import { CmdlineComponent } from "./cmdline";
import { PopupmenuComponent } from "./popupmenu";
import { NotificateComponent } from "./notificate";
import { InputComponent } from "./input";

interface Props {
  width: number;
  height: number;
}

interface States {
  font: { width: number; height: number; size: number; };
}

const position: "relative" = "relative"
const style = {
  position,
  overflow: "hidden",
};

export class EnvimComponent extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);

    this.state = { font: font.get() };

    Emit.on("envim:zoom-in", this.onZoomIn.bind(this));
    Emit.on("envim:zoom-out", this.onZoomOut.bind(this));
  }

  private zoom(offset: number) {
    const { size } = font.get();
    const next = { size: size + offset, width: (size + offset) / 2, height: size + offset + 1 };

    font.set(next);
    this.setState({ font: next });
  }

  private onZoomIn() {
    this.zoom(1);
  }

  private onZoomOut() {
    this.zoom(-1);
  }

  render() {
    const { height } = font.get();
    const win = this.props;
    const editor = { width: win.width, height: Math.floor((win.height - height - 4) / height) * height };
    const header = { width: win.width, height: win.height - editor.height };
    const footer = { width: win.width, height: Math.min(editor.height, height * 15) };

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
