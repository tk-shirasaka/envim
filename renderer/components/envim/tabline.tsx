import React, { MouseEvent } from "react";

import { Emit } from "../../utils/emit";
import { icons } from "../../utils/icons";

import { IconComponent } from "../icon";

interface Props {
  width: number;
  height: number;
}

interface States {
  tabs: { name: string; type: string; active: boolean }[];
  qf: number;
  lc: number;
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
    padding: "0 4px",
  },
};

export class TablineComponent extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);
    this.state = { tabs: [], qf: 0, lc: 0 }

    Emit.on("tabline:update", this.onTabline.bind(this));
  }

  componentWillUnmount() {
    Emit.clear(["tabline:update"]);
  }

  private onCommand(command: string, e: MouseEvent | null = null) {
    e?.stopPropagation();
    e?.preventDefault();

    Emit.send("envim:command", command);
    Emit.share("envim:focus");
  }

  private onSelect(e: MouseEvent, i: number) {
    this.onCommand(`tabnext ${i + 1}`, e);
  }

  private onClose(e: MouseEvent, i: number) {
    this.onCommand(`tabclose ${i + 1}`, e);
  }

  private onPlus() {
    this.onCommand("$tabnew");
  }

  private onTabline(tabs: States["tabs"], qf: number, lc: number) {
    this.setState({ tabs, qf, lc });
  }

  private getTabStyle(active: boolean) {
    return active ? {...styles.tab, ...styles.active} : styles.tab;
  }

  private getStyle(style: { [k: string]: number | string }) {
    const lineHeight = `${this.props.height}px`;
    return {...style, lineHeight};
  }

  private getIcon(type: string) {
    const icon = icons.filter(icon => icon.type.indexOf(type) >= 0).pop();
    return icon && <IconComponent color={icon.color} style={this.getStyle(styles.icon)} font={icon.font} />;
  }

  renderQuickfix(type: "qf" | "lc") {
    const color = type === "qf" ? "red" : "yellow";
    const command = type === "qf" ? "copen" : "lopen";

    return this.state[type] === 0 ? null : (
      <div className={`color-${color}-fg clickable`} onClick={() => this.onCommand(command)}>
        <IconComponent color="none" style={{...styles.icon, lineHeight: `${this.props.height}px`}} font="" />{ this.state[type] }
      </div>
    );
  }

  render() {
    return (
      <div style={{...this.props, ...styles.scope}}>
        {this.state.tabs.map((tab, i) => (
          <div key={i} className={`color-black ${tab.active ? "active" : "clickable"}`} style={this.getTabStyle(tab.active)} onClick={e => this.onSelect(e, i)}>
            { this.getIcon(tab.type) }
            <span style={this.getStyle(styles.name)}>{ tab.name }</span>
            {tab.active || <IconComponent color="red-fg" style={this.getStyle(styles.icon)} font="" onClick={e => this.onClose(e, i)} />}
          </div>
        ))}
        <IconComponent color="green-fg" style={{...styles.icon, lineHeight: `${this.props.height}px`}} font="" onClick={() => this.onPlus()} />
        <div className="space" />
        { this.renderQuickfix("lc") }
        { this.renderQuickfix("qf") }
      </div>
    );
  }
}
