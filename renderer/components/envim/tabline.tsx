import React, { MouseEvent } from "react";

import { ITab, IMessage } from "../../../common/interface";

import { Emit } from "../../utils/emit";
import { Setting } from "../../utils/setting";
import { icons, notificates } from "../../utils/icons";

import { IconComponent } from "../icon";

interface Props {
  width: number;
  height: number;
}

interface States {
  tabs: ITab[];
  qf: number;
  lc: number;
  messages: IMessage[];
  setting: { [k: string]: boolean; };
}

const whiteSpace: "nowrap" = "nowrap";
const direction: "rtl" = "rtl";
const styles = {
  scope: {
    display: "flex",
  },
  tab: {
    display: "flex",
    alignItems: "center",
    margin: "4px 4px 0 0",
    minWidth: 0,
    cursor: "default",
    borderBottom: 2,
    borderRadius: "4px 4px 0 0",
    boxShadow: "0 0 4px 0 rgba(0, 0, 0, 0.6)",
  },
  name: {
    maxWidth: 300,
    padding: "0 4px",
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace,
    direction,
  },
  active: {
    borderBottom: "solid 2px #2295c5",
    zIndex: 1,
  },
  notify: {
    maxWidth: 300,
    padding: "0 4px",
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace,
  },
  icon: {
    padding: "0 4px",
  },
};

export class TablineComponent extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);
    this.state = { tabs: [], qf: 0, lc: 0, messages: [], setting: Setting.others };

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
    const command = this.state.tabs.length > 1 ? `tabclose ${i + 1}` : "quit";
    this.onCommand(command, e);
  }

  private onPlus() {
    this.onCommand("$tabnew");
  }

  private toggleNotify(e: MouseEvent) {
    const setting = { ...Setting.others, notify: !this.state.setting.notify };

    e.stopPropagation();
    e.preventDefault();

    Setting.others = setting;
    Emit.share("envim:focus");
    this.setState({ setting });
  }

  private onDetach() {
    Emit.send("envim:detach");
  }

  private onTabline(tabs: ITab[], qf: number, lc: number) {
    this.setState({ tabs, qf, lc });
  }

  private onMessage(messages: IMessage[]) {
    messages = messages.filter(({ group }) => group === 1);
    this.setState({ messages });
  }

  private getTabStyle(active: boolean) {
    return active ? {...styles.tab, ...styles.active} : styles.tab;
  }

  private getStyle(style: { [k: string]: number | string }) {
    const lineHeight = `${this.props.height}px`;
    return {...style, lineHeight};
  }

  private renderIcon(type: string) {
    const icon = icons.filter(icon => type.search(icon.type) >= 0).shift();
    return icon && <IconComponent color={icon.color} style={styles.icon} font={icon.font} />;
  }

  private renderQuickfix(type: "qf" | "lc") {
    const color = { qf: "red", lc: "yellow" }[type];
    const command = type === "qf" ? "copen" : "lopen";

    return <IconComponent color={`${color}-fg-dark`} style={this.getStyle(styles.icon)} font="" text={this.state[type]} animation="fade-in" onClick={() => this.onCommand(command)} />;
  }

  private renderNotify() {
    const last = [ ...this.state.messages ].pop();
    const kind = last?.kind || "";
    const color = notificates.filter(icon => icon.kinds.indexOf(kind) >= 0)[0].color;
    const message = this.state.setting.notify ? "" : last?.contents.map(({ content }, i) => i < 5 ? content : "").join("");

    return <IconComponent color={`${color}-fg-dark`} style={this.getStyle(styles.notify)} font="" text={message} animation="fade-in" onClick={this.toggleNotify.bind(this)} />;
  }

  render() {
    return (
      <div className="color-black" style={{...this.props, ...styles.scope}}>
        {this.state.tabs.map((tab, i) => (
          <div key={i} className={`animate fade-in color-black ${tab.active ? "active" : "clickable"}`} style={this.getTabStyle(tab.active)} onClick={e => this.onSelect(e, i)}>
            { this.renderIcon(tab.type) }
            <span style={styles.name}>{ tab.name }</span>
            { tab.edit && <IconComponent color="gray-fg" style={styles.icon} font="" /> }
            { tab.protect && <IconComponent color="yellow-fg" style={styles.icon} font="" /> }
            <IconComponent color="red-fg" style={styles.icon} font="" onClick={e => this.onClose(e, i)} />
          </div>
        ))}
        { this.state.tabs.length > 0 && <IconComponent color="green-fg" style={this.getStyle(styles.icon)} font="" onClick={this.onPlus.bind(this)} /> }
        <div className="space dragable" />
        { this.state.lc > 0 && this.renderQuickfix("lc") }
        { this.state.qf > 0 && this.renderQuickfix("qf") }
        { this.state.messages.length > 0 && this.renderNotify() }
        <IconComponent color="black" style={this.getStyle(styles.icon)} font="" onClick={this.onDetach.bind(this)} />
      </div>
    );
  }
}
