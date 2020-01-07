import React from "react";
import { ipcRenderer } from "electron";

import { Emit } from "../utils/emit";

interface Props {
}

interface States {
  visible: boolean;
  style: { top: number; left: number; };
}

const position: "absolute" = "absolute";
const userSelect: "none" = "none";
const styles = {
  ul: {
    position,
    userSelect,
    width: 150,
    background: "#464444",
    margin: 0,
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

    this.state = { visible: false, style: { top: 0, left: 0 } };
    Emit.on("menu:on", this.onMenu.bind(this));
    Emit.on("menu:off", this.offMenu.bind(this));
  }

  componentWillUnmount() {
    Emit.clear("menu:on");
    Emit.clear("menu:off");
  }

  private onMenu(y: number, x: number) {
    this.setState({ visible: true, style: { top: y, left: x } });
  }

  private offMenu() {
    this.setState({ visible: false });
  }

  render() {
    const menus = [
      { key: 1, label: "Quit", onClick: () => ipcRenderer.send("envim:detach") },
    ];

    return this.state.visible && (
      <ul style={{ ...styles.ul, ...this.state.style }}>
        { menus.map(({key, label, onClick}) => <li key={key} style={styles.li} onClick={onClick.bind(this)}>{ label }</li>) }
      </ul>
    );
  }
}
