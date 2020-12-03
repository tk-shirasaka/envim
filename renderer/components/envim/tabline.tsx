import React, { MouseEvent } from "react";

import { ITab, IMessage, IMode, IMenu } from "../../../common/interface";

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
  mode?: IMode;
  message: { notificate?: IMessage; mode?: IMessage; command?: IMessage; ruler?: IMessage; };
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
    borderLeft: "solid 1px #646079",
  },
  submenu: {
    zIndex: 20,
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
    this.state = { tabs: [], menus: [], message: {}, setting: Setting.others };

    Emit.on("tabline:update", this.onTabline.bind(this));
    Emit.on("menu:update", this.onMenu.bind(this));
    Emit.on("mode:change", this.changeMode.bind(this));
    Emit.on("messages:notificate", this.onNotificate.bind(this));
    Emit.on("messages:mode", this.onMode.bind(this));
    Emit.on("messages:command", this.onCommand.bind(this));
    Emit.on("messages:ruler", this.onRuler.bind(this));
    Emit.on("setting:others", this.offNotify.bind(this));
  }

  componentWillUnmount() {
    Emit.clear(["tabline:update", "menu:update", "mode:change", "messages:notificate", "messages:mode", "messages:command", "messages:ruler", "setting:others"]);
  }

  private runCommand(command: string, e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();

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
    const menus = this.state.menus
    menus[i].active = menus[i].active ? false : true;

    e.stopPropagation();
    e.preventDefault();

    this.setState({ menus });
  }

  private onTabline(tabs: ITab[]) {
    this.setState({ tabs });
  }

  private onMenu(menus: IMenu[]) {
    menus = menus.filter(menu => !menu.hidden).map(menu => ({ ...menu, submenus: menu.submenus?.filter(submenu => !submenu.submenus && !submenu.hidden) }));
    this.setState({ menus });
  }

  private changeMode(mode: IMode) {
    this.setState({ mode });
  }

  private onMessage(type: "notificate" | "mode" | "command" | "ruler", messages: IMessage[]) {
    const message = this.state.message;

    if (messages.length) {
      message[type] = [ ...messages ].pop();
    } else {
      delete(message[type]);
    }
    this.setState({ message });
  }

  private onNotificate(messages: IMessage[]) {
    this.onMessage("notificate", messages);
  }

  private onMode(messages: IMessage[]) {
    this.onMessage("mode", messages);
  }

  private onCommand(messages: IMessage[]) {
    this.onMessage("command", messages);
  }

  private onRuler(messages: IMessage[]) {
    this.onMessage("ruler", messages);
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

  private renderSubmenu(menu: IMenu) {
    const style = { top: this.props.height, ...styles.submenu };
    const sname = this.state.mode?.short_name;
    return !sname || !menu.active ? null : (
      <div className="animate fade-in" style={style}>
        { menu.submenus?.map((submenu, i) => {
          const command = `emenu ${menu.name.replace(/([\. ])/g, "\\$1")}.${submenu.name.replace(/([\. ])/g, "\\$1")}`;
          return submenu.mappings[sname]?.enabled && <div key={i} className="color-black clickable" style={styles.space} onClick={e => this.runCommand(command, e)}>{ submenu.name }</div>
        })}
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
        { this.state.message.ruler && this.renderNotify(this.state.message.ruler, false) }
        { this.state.message.command && this.renderNotify(this.state.message.command, false) }
        { this.state.message.mode && this.renderNotify(this.state.message.mode, false) }
        { !this.state.setting.notify && this.state.message.notificate && this.renderNotify(this.state.message.notificate, true) }
        { this.state.menus.map((menu, i) => (
          <div key={i} className={`color-black ${menu.active ? "active" : "clickable"}`} style={styles.menu} onMouseEnter={e => this.toggleMenu(i, e)} onMouseLeave={e => this.toggleMenu(i, e)}>
            { menu.name }
            { this.renderSubmenu(menu) }
          </div>
        ))}
      </div>
    );
  }
}
