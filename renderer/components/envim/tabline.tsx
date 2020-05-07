import React, { MouseEvent } from "react";

import { IMessage } from "../../../common/interface";

import { Emit } from "../../utils/emit";
import { Localstorage } from "../../utils/localstorage";
import { icons, notificates } from "../../utils/icons";

import { IconComponent } from "../icon";

interface Props {
  width: number;
  height: number;
}

interface States {
  tabs: { name: string; type: string; active: boolean; }[];
  qf: number;
  lc: number;
  messages: IMessage[];
  setting: { others: { notify: boolean; } };
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
  private ls: Localstorage<States["setting"]> = new Localstorage<States["setting"]>("setting", { others: { notify: true } });

  constructor(props: Props) {
    super(props);
    this.state = { tabs: [], qf: 0, lc: 0, messages: [], setting: this.ls.get() };

    Emit.on("tabline:update", this.onTabline.bind(this));
    Emit.on("messages:notificate", this.onMessage.bind(this));
  }

  componentWillUnmount() {
    Emit.clear(["tabline:update", "messages:notificate"]);
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

  private toggleNotify(e: MouseEvent) {
    const setting = this.state.setting;
    setting.others.notify = !setting.others.notify;

    e.stopPropagation();
    e.preventDefault();

    Emit.share("setting:notify", setting);
    Emit.share("envim:focus");
    this.ls.set(setting);
    this.setState({ setting });
  }

  private onTabline(tabs: States["tabs"], qf: number, lc: number) {
    this.setState({ tabs, qf, lc });
  }

  private onMessage(messages: IMessage[]) {
    this.setState({ messages });
  }

  private getTabStyle(active: boolean) {
    return active ? {...styles.tab, ...styles.active} : styles.tab;
  }

  private getStyle(style: { [k: string]: number | string }) {
    const lineHeight = `${this.props.height}px`;
    return {...style, lineHeight};
  }

  private getIcon(type: string) {
    const icon = icons.filter(icon => type.search(icon.type) >= 0).shift();
    return icon && <IconComponent color={icon.color} style={this.getStyle(styles.icon)} font={icon.font} />;
  }

  private renderQuickfix(type: "qf" | "lc") {
    const color = type === "qf" ? "red" : "yellow";
    const command = type === "qf" ? "copen" : "lopen";

    return this.state[type] === 0 ? null : (
      <div className={`color-${color}-fg clickable`} onClick={() => this.onCommand(command)}>
        <IconComponent color="none" style={{...styles.icon, lineHeight: `${this.props.height}px`}} font="" />{ this.state[type] }
      </div>
    );
  }

  private renderNotify() {
    const i = this.state.messages.length;
    const kind = this.state.messages.filter(({ group }) => group === 1).pop()?.kind || "";
    const color = notificates.filter(icon => icon.kinds.indexOf(kind) >= 0)[0].color;
    const notify = this.state.setting.others.notify;
    const icon = notify ? "" : "";
    return i === 0 ? null : (
      <div className={`color-${color}-fg clickable`} onClick={this.toggleNotify.bind(this)}>
      <IconComponent color="none" style={{...styles.icon, lineHeight: `${this.props.height}px`}} font={icon} />{ notify ? "" : i }
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
        { this.renderNotify() }
      </div>
    );
  }
}
