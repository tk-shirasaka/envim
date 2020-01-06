import React from "react";
import { ipcRenderer, clipboard, IpcRendererEvent } from "electron";

import { Emit } from "../utils/emit";

interface Props {
}

interface States {
  visible: boolean;
  style: { marginTop: number; marginLeft: number; };
}

const position: "absolute" = "absolute";
const userSelect: "none" = "none";
const styles = {
  scope: {
    position,
    userSelect,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,.2)",
  },
  ul: {
    width: 150,
    background: "#464444",
    padding: 0,
  },
  li: {
    padding: 4,
    listStyle: "none",
  },
};

export class MenuComponent extends React.Component<Props, States> {

  constructor(props: Props) {
    super(props);

    this.state = { visible: false, style: { marginTop: 0, marginLeft: 0 } };
    ipcRenderer.on("envim:clipboard", this.onClipboard.bind(this));
    Emit.on("menu:on", this.onMenu.bind(this));
  }

  private onMenu(y: number, x: number) {
    this.setState({ visible: true, style: { marginTop: y, marginLeft: x } });
  }

  private offMenu() {
    this.setState({ visible: false });
    Emit.send("menu:off");
  }

  private onClipboard(_: IpcRendererEvent, data: string) {
    clipboard.writeText(data);
  }

  render() {
    const menus = [
      { key: 1, label: "Stop Envim", onClick: () => location.reload() },
      { key: 2, label: "Copy", onClick: () => ipcRenderer.send("envim:copy") },
      { key: 3, label: "Paste", onClick: () => ipcRenderer.send("envim:paste", clipboard.readText()) },
    ];

    return this.state.visible && (
      <div style={styles.scope} onClick={this.offMenu.bind(this)}>
        <ul style={{ ...styles.ul, ...this.state.style }}>
          { menus.map(({key, label, onClick}) => <li key={key} style={styles.li} onClick={onClick.bind(this)}>{ label }</li>) }
        </ul>
      </div>
    );
  }
}
