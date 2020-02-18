import React from "react";
import { ipcRenderer, IpcRendererEvent } from "electron";

import { font } from "../../utils/font";

import { TablineComponent } from "./tabline";
import { EditorComponent } from "./editor";
import { HistoryComponent } from "./history";
import { CmdlineComponent } from "./cmdline";
import { PopupmenuComponent } from "./popupmenu";
import { NotificateComponent } from "./notificate";
import { InputComponent } from "./input";

interface Props {
}

interface States {
  header: { width: number, height: number; };
  editor: { width: number, height: number; };
  footer: { width: number, height: number; };
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

    ipcRenderer.on("envim:zoom-in", this.onZoomIn.bind(this));
    ipcRenderer.on("envim:zoom-out", this.onZoomOut.bind(this));
    ipcRenderer.on("envim:title", this.onTitle.bind(this));
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.onResize);
  }

  private zoom(offset: number) {
    const { size } = font.get();

    font.set({ size: size + offset, width: (size + offset) / 2, height: size + offset + 1 });
    this.setState(this.newState());
  }

  private onZoomIn() {
    this.zoom(1);
  }

  private onZoomOut() {
    this.zoom(-1);
  }




  private onTitle(_: IpcRendererEvent, title: string) {
    document.title = title || 'Envim';
  }

  private newState() {
    const { height } = font.get();
    const win = { width: window.innerWidth, height: window.innerHeight };
    const editor = { width: win.width, height: Math.floor((win.height - height - 4) / height) * height };
    const header = { width: win.width, height: win.height - editor.height };
    const footer = { width: win.width, height: Math.min(editor.height, height * 15) };

    return { header, editor, footer };
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
        <TablineComponent {...this.state.header} />
        <div style={{...style, ...this.state.editor}}>
          <EditorComponent {...this.state.editor} />
          <HistoryComponent {...this.state.footer} />
          <CmdlineComponent {...this.state.footer} />
          <PopupmenuComponent />
          <NotificateComponent />
        </div>
        <InputComponent />
      </>
    );
  }
}
