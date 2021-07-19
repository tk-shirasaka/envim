import React from "react";

import { ITab, IMode, IMenu } from "../../../common/interface";

import { Emit } from "../../utils/emit";
import { icons } from "../../utils/icons";

import { IconComponent } from "../icon";

interface Props {
  width: number;
  height: number;
}

interface States {
  tabs: ITab[];
  menus: IMenu[];
  mode?: IMode;
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
    borderBottom: "2px solid",
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
    this.state = { tabs: [], menus: [] };

    Emit.on("tabline:update", this.onTabline.bind(this));
    Emit.on("menu:update", this.onMenu.bind(this));
    Emit.on("mode:change", this.changeMode.bind(this));
  }

  componentWillUnmount() {
    Emit.clear(["tabline:update", "menu:update", "mode:change", "messages:mode", "messages:command", "messages:ruler"]);
  }

  private runCommand(command: string) {
    Emit.send("envim:command", command);
  }

  private toggleMenu(i: number) {
    const menus = this.state.menus
    menus[i].active = menus[i].active ? false : true;

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

  private getStyle(style: { [k: string]: number | string }) {
    const lineHeight = `${this.props.height}px`;
    return {...style, lineHeight};
  }

  private renderTab(i: number, tab: ITab) {
    const icon = icons.filter(icon => tab.filetype.search(icon.type) >= 0 || tab.buftype.search(icon.type) >= 0).shift();

    if (!icon) return null;

    const color = `color-${icon.color}-dark`;
    const modified = tab.active ? "active" : "clickable";
    return (
      <div key={i} className={`animate fade-in ${color} ${modified}`} style={styles.tab} onClick={_ => this.runCommand(`tabnext ${i + 1}`,)}>
        <IconComponent color={icon.color} style={styles.name} font={icon.font} text={tab.name.replace(/([^\/])[^\/]*\//g, "$1/")} />
        <IconComponent color="red-fg" style={styles.space} font="" onClick={_ => this.runCommand(this.state.tabs.length > 1 ? `tabclose! ${i + 1}` : "quitall")} />
      </div>
    );
  }

  private renderSubmenu(menu: IMenu) {
    const style = { top: this.props.height, ...styles.submenu };
    const sname = this.state.mode?.short_name;
    return !sname || !menu.active ? null : (
      <div className="animate fade-in" style={style}>
        { menu.submenus?.map((submenu, i) => {
          const command = `emenu ${menu.name.replace(/([\. ])/g, "\\$1")}.${submenu.name.replace(/([\. ])/g, "\\$1")}`;
          return submenu.mappings[sname]?.enabled && submenu.mappings[sname]?.rhs
            ? <div key={i} className="color-black clickable" style={styles.space} onClick={_ => this.runCommand(command)}>{ submenu.name }</div>
            : <div key={i} className="color-gray-fg-dark" style={styles.space} onClick={_ => this.runCommand("")}>{ submenu.name }</div>
        })}
      </div>
    );
  }

  render() {
    return (
      <div className="color-black" style={{...this.props, ...styles.scope}}>
        {this.state.tabs.map((tab, i) => this.renderTab(i, tab))}
        { this.state.tabs.length > 0 && <IconComponent color="green-fg" style={this.getStyle(styles.space)} font="" onClick={_ => this.runCommand("$tabnew")} /> }
        <div className="space dragable" />
        { this.state.menus.map((menu, i) => (
          <div key={i} className={`color-black ${menu.active ? "active" : "clickable"}`} style={styles.menu} onMouseEnter={_ => this.toggleMenu(i)} onMouseLeave={_ => this.toggleMenu(i)}>
            { menu.name }
            { this.renderSubmenu(menu) }
          </div>
        ))}
      </div>
    );
  }
}
