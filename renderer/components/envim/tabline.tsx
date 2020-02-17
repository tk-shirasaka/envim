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
const positionR: "relative" = "relative";
const positionA: "absolute" = "absolute";
const styles = {
  scope: {
    display: "flex",
  },
  tabs: {
    position: positionR,
    cursor: "default",
    maxWidth: 300,
    padding: "0 24px 0 10px",
    borderBottom: 2,
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace,
  },
  active: {
    borderBottom: "solid 2px #2295c5",
  },
  close: {
    position: positionA,
    right: 0,
    padding: "0 8px",
  },
  add: {
    padding: "0 8px",
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

  private onSelect(i: number) {
    ipcRenderer.send("envim:command", `tabnext ${i + 1}`);
  }

  private onClose(i: number) {
    ipcRenderer.send("envim:command", `tabclose ${i + 1}`);
  }

  private onPlus() {
    ipcRenderer.send("envim:command", "tabnew");
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
          <div key={i} className={`color-black ${tab.active ? "active" : "clickable"}`} style={this.getChildStayle(tab.active)} onClick={() => this.onSelect(i)}>
            { this.getIcon(tab.type) }
            { tab.name }
            <i className={`color-red-fg-dark ${tab.active ? "active" : "clickable"}`} style={{...styles.close, fontSize: size}} onClick={() => this.onClose(i)}></i>
          </div>
        ))}
        <i className="color-green-fg-dark clickable" style={{...styles.add, fontSize: size, lineHeight: `${this.props.height}px`}} onClick={() => this.onPlus()}></i>
      </div>
    );
  }
}
