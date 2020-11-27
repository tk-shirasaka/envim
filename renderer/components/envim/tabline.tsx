import React, { MouseEvent } from "react";

import { ITab, IMessage, IMenu } from "../../../common/interface";

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
  menus: IMenu[];
  qf: number;
  lc: number;
  notificate: IMessage | null;
  mode: IMessage | null;
  command: IMessage | null;
  ruler: IMessage | null;
  setting: { [k: string]: boolean; };
}

const whiteSpace: "nowrap" = "nowrap";
const positionR: "relative" = "relative";
const positionA: "absolute" = "absolute";
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
    lineHeight: 0,
    whiteSpace,
  },
  active: {
    zIndex: 10,
    borderBottom: "solid 2px #2295c5",
  },
  notify: {
    maxWidth: 300,
    padding: "0 4px",
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace,
  },
  menu: {
    display: "flex",
    position: positionR,
    alignItems: "center",
    padding: 4,
    minWidth: 0,
    borderRight: "solid 1px #646079",
  },
  submenu: {
    zIndex: 10,
    position: positionA,
    right: 0,
    boxShadow: "8px 8px 4px 0 rgba(0, 0, 0, 0.6)",
    whiteSpace,
  },
  space: {
    padding: "0 4px",
  },
};

export class TablineComponent extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);
    this.state = { tabs: [], menus: [], qf: 0, lc: 0, notificate: null, mode: null, command: null, ruler: null, setting: Setting.others };

    Emit.on("tabline:update", this.onTabline.bind(this));
    Emit.on("menu:update", this.onMenu.bind(this));
    Emit.on("messages:notificate", this.onNotificate.bind(this));
    Emit.on("messages:mode", this.onMode.bind(this));
    Emit.on("messages:command", this.onCommand.bind(this));
    Emit.on("messages:ruler", this.onRuler.bind(this));
    Emit.on("setting:others", this.offNotify.bind(this));
  }

  componentWillUnmount() {
    Emit.clear(["tabline:update", "menu:update", "messages:notificate", "messages:mode", "messages:command", "messages:ruler", "setting:others"]);
  }

  private runCommand(command: string, e: MouseEvent | null = null) {
    e?.stopPropagation();
    e?.preventDefault();

    Emit.send("envim:command", command);
    Emit.share("envim:focus");
  }

  private onNotify(e: MouseEvent) {
    const setting = { ...Setting.others, notify: true };

    e.stopPropagation();
    e.preventDefault();

    Setting.others = setting;
    Emit.share("envim:focus");
    this.setState({ setting });
  }

  private offNotify() {
    this.setState({ setting: Setting.others });
  }

  private toggleMenu(i: number, e: MouseEvent) {
    const menus = this.state.menus.map((menu, j) => ({ ...menu, active: i !== j || menu.active ? false : true }));

    e.stopPropagation();
    e.preventDefault();

    this.setState({ menus });
  }

  private runMenu(i: number, command: string, e: MouseEvent) {
    this.toggleMenu(i, e);
    this.runCommand(command);
  }

  private onTabline(tabs: ITab[], qf: number, lc: number) {
    this.setState({ tabs, qf, lc });
  }

  private onMenu(menus: IMenu[]) {
    menus = menus.filter(menu => !menu.hidden).map(menu => ({ ...menu, submenus: menu.submenus?.filter(submenu => !submenu.submenus && !submenu.hidden) }));
    this.setState({ menus });
  }

  private onNotificate(notificate: IMessage[]) {
    this.setState({ notificate: [ ...notificate ].pop() || null });
  }

  private onMode(mode: IMessage[]) {
    this.setState({ mode: [ ...mode ].pop() || null });
  }

  private onCommand(command: IMessage[]) {
    this.setState({ command: [ ...command ].pop() || null });
  }

  private onRuler(ruler: IMessage[]) {
    this.setState({ ruler: [ ...ruler ].pop() || null });
  }

  private getTabStyle(active: boolean) {
    return active ? {...styles.tab, ...styles.active} : styles.tab;
  }

  private getStyle(style: { [k: string]: number | string }) {
    const lineHeight = `${this.props.height}px`;
    return {...style, lineHeight};
  }

  private renderName(tab: ITab) {
    const icon = icons.filter(icon => tab.filetype.search(icon.type) >= 0 || tab.buftype.search(icon.type) >= 0).shift();
    return icon && <IconComponent color={icon.color} style={styles.name} font={icon.font} text={tab.name.replace(/([^\/])[^\/]*\//g, "$1/")} />;
  }

  private renderQuickfix(type: "qf" | "lc") {
    const color = { qf: "red", lc: "yellow" }[type];
    const command = type === "qf" ? "copen" : "lopen";

    return <IconComponent color={`${color}-fg-dark`} style={this.getStyle(styles.space)} font="" text={this.state[type]} animation="fade-in" onClick={() => this.runCommand(command)} />;
  }

  private renderNotify(message: IMessage, notify: boolean) {
    const kind = message.kind;
    const { color, font } = notificates.filter(icon => icon.kinds.indexOf(kind) >= 0)[0];
    const text = message.contents.map(({ content }, i) => i < 5 ? content : "").join("");

    return notify ? (
      <IconComponent color={`${color}-fg-dark`} style={this.getStyle(styles.notify)} font={font} text={text} animation="fade-in" onClick={this.onNotify.bind(this)} />
    ) : (
      <IconComponent color={`${color}-fg-dark`} style={this.getStyle(styles.notify)} font={font} text={text} animation="fade-in" />
    );
  }

  private renderSubmenu(i: number, menu: IMenu) {
    const style = { top: this.props.height, ...styles.submenu };
    return !menu.active ? null : (
      <div className="animate fade-in" style={style}>
        { menu.submenus?.map((submenu, j) => (
          <div key={j} className="color-black clickable" style={styles.space} onClick={e => this.runMenu(i, `emenu ${menu.name.replace(/\./g, "\\.")}.${submenu.name.replace(/\./g, "\\.")}`, e)}>{ submenu.name }</div>
        ))}
      </div>
    );
  }

  render() {
    return (
      <div className="color-black" style={{...this.props, ...styles.scope}}>
        {this.state.tabs.map((tab, i) => (
          <div key={i} className={`animate fade-in color-black ${tab.active ? "active" : "clickable"}`} style={this.getTabStyle(tab.active)} onClick={e => this.runCommand(`tabnext ${i + 1}`, e)}>
            { this.renderName(tab) }
            { tab.edit && <IconComponent color="gray-fg" style={styles.space} font="" /> }
            { tab.protect && <IconComponent color="yellow-fg" style={styles.space} font="" /> }
            <IconComponent color="red-fg" style={styles.space} font="" onClick={e => this.runCommand(this.state.tabs.length > 1 ? `tabclose! ${i + 1}` : "quit", e)} />
          </div>
        ))}
        { this.state.tabs.length > 0 && <IconComponent color="green-fg" style={this.getStyle(styles.space)} font="" onClick={e => this.runCommand("tabnew", e)} /> }
        <div className="space dragable" />
        { this.state.ruler && this.renderNotify(this.state.ruler, false) }
        { this.state.command && this.renderNotify(this.state.command, false) }
        { this.state.mode && this.renderNotify(this.state.mode, false) }
        { !this.state.setting.notify && this.state.notificate && this.renderNotify(this.state.notificate, true) }
        { this.state.lc > 0 && this.renderQuickfix("lc") }
        { this.state.qf > 0 && this.renderQuickfix("qf") }
        { this.state.menus.map((menu, i) => (
          <div key={i} className={`color-black ${menu.active ? "active" : "clickable"}`} style={styles.menu} onClick={e => this.toggleMenu(i, e)}>
            { menu.name }
            { this.renderSubmenu(i, menu) }
          </div>
        ))}
        <IconComponent color="black" style={this.getStyle(styles.space)} font="ﮠ" onClick={e => this.runCommand("messages", e)} />
      </div>
    );
  }
}
