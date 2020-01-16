import React from "react";
import { ipcRenderer, IpcRendererEvent } from "electron";

import { icons } from "../utils/icons";

interface Props {
  font: { size: number; width: number; height: number; };
}

interface States {
  tabs: { name: string; type: string; active: boolean }[];
}

const styles = {
  scope: {
    display: "flex",
  },
  tabs: {
    cursor: "pointer",
    background: "#4a4646",
    padding: "4px 30px 2px 10px",
    borderBottom: "solid 2px #4a4646"
  },
  active: {
    background: "#5a5757",
    borderBottom: "solid 2px #2295c5",
  },
};

export class TablineComponent extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);
    this.state = { tabs: [] }

    ipcRenderer.on("envim:tabline", this.onTabline.bind(this));
  }

  componentWillUnmount() {
    ipcRenderer.removeAllListeners("envim:tabline");
  }

  private onClick(i: number) {
    ipcRenderer.send("envim:tab", i + 1);
  }

  private onTabline(_: IpcRendererEvent, tabs: States["tabs"]) {
    this.setState({ tabs });
  }

  private getChildStayle(active: boolean) {
    return active
      ? {...styles.tabs, ...styles.active}
      : styles.tabs;
  }

  private getIcon(type: string) {
    const icon = icons.filter(icon => icon.type.indexOf(type) >= 0).pop();
    return icon && (<i style={{color: icon.color, marginRight: 8, fontSize: this.props.font.size}}>{icon.font}</i>);
  }

  render() {
    return (
      <div style={{height: this.props.font.height + 8, fontSize: this.props.font.size, ...styles.scope}}>
        {this.state.tabs.map((tab, i) => (
          <div key={i} style={this.getChildStayle(tab.active)} onClick={() => this.onClick(i)}>
            { this.getIcon(tab.type) }
            { tab.name }
          </div>
        ))}
      </div>
    );
  }
}
