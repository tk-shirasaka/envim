import React, { MouseEvent } from "react";

import { Emit } from "../../utils/emit";
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
  tab: {
    display: "flex",
    minWidth: 0,
    cursor: "default",
    borderBottom: 2,
  },
  name: {
    maxWidth: 300,
    padding: "0 4px",
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace,
  },
  active: {
    borderBottom: "solid 2px #2295c5",
  },
  icon: {
    padding: "0 8px",
  },
};

export class TablineComponent extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);
    this.state = { tabs: [] }

    Emit.on("envim:tabline", this.onTabline.bind(this));
  }

  componentWillUnmount() {
    Emit.clear(["envim:tabline"]);
  }

  private onSelect(e: MouseEvent, i: number) {
    e.stopPropagation();
    e.preventDefault();
    Emit.send("envim:command", `tabnext ${i + 1}`);
  }

  private onClose(e: MouseEvent, i: number) {
    e.stopPropagation();
    e.preventDefault();
    Emit.send("envim:command", `tabclose ${i + 1}`);
  }

  private onPlus() {
    Emit.send("envim:command", "$tabnew");
  }

  private onTabline(tabs: States["tabs"]) {
    this.setState({ tabs });
  }

  private getChildStayle(active: boolean) {
    const base = { lineHeight: `${this.props.height}px` };
    return active
      ? {...base, ...styles.tab, ...styles.active}
      : {...base, ...styles.tab};
  }

  private getIcon(type: string) {
    const icon = icons.filter(icon => icon.type.indexOf(type) >= 0).pop();
    const { size } = font.get();
    return icon && (<i style={{color: icon.color, padding: "0 4px", fontSize: size}}>{icon.font}</i>);
  }

  render() {
    const { size } = font.get();
    return (
      <div style={{...this.props, fontSize: size, ...styles.scope}}>
        {this.state.tabs.map((tab, i) => (
          <div key={i} className={`color-black ${tab.active ? "active" : "clickable"}`} style={this.getChildStayle(tab.active)} onClick={e => this.onSelect(e, i)}>
            { this.getIcon(tab.type) }
            <span style={styles.name}>{ tab.name }</span>
            {tab.active || <i className={`color-red-fg ${tab.active ? "active" : "clickable"}`} style={{...styles.icon, fontSize: size}} onClick={e => this.onClose(e, i)}></i>}
          </div>
        ))}
        <i className="color-green-fg-dark clickable" style={{...styles.icon, fontSize: size, lineHeight: `${this.props.height}px`}} onClick={() => this.onPlus()}></i>
      </div>
    );
  }
}
