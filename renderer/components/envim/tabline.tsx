import React from "react";
import { ipcRenderer, IpcRendererEvent } from "electron";

import { icons } from "../../utils/icons";
import { font } from "../../utils/font";

interface Props {
  width: number;
  height: number;
}

interface States {
  tabs: { name: string; type: string; active: boolean }[];
}

const whiteSpace: "nowrap" = "nowrap";
const styles = {
  scope: {
    display: "flex",
  },
  tabs: {
    cursor: "pointer",
    background: "#4a4646",
    maxWidth: 300,
    padding: "0 10px",
    borderBottom: "solid 2px #4a4646",
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace,
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
    ipcRenderer.send("envim:command", `tabnext ${i + 1}`);
  }

  private onTabline(_: IpcRendererEvent, tabs: States["tabs"]) {
    this.setState({ tabs });
  }

  private getChildStayle(active: boolean) {
    const base = { lineHeight: `${this.props.height}px` };
    return active
      ? {...base, ...styles.tabs, ...styles.active}
      : {...base, ...styles.tabs};
  }

  private getIcon(type: string) {
    const icon = icons.filter(icon => icon.type.indexOf(type) >= 0).pop();
    const { size } = font.get();
    return icon && (<i style={{color: icon.color, marginRight: 8, fontSize: size}}>{icon.font}</i>);
  }

  render() {
    const { size } = font.get();
    return (
      <div style={{...this.props, fontSize: size, ...styles.scope}}>
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
