import React from "react";

import { ITab, IBuffer, IMode, IMenu } from "../../../common/interface";

import { Emit } from "../../utils/emit";
import { Setting } from "../../utils/setting";
import { icons } from "../../utils/icons";

import { IconComponent } from "../icon";
import { MenuComponent } from "../menu";

interface Props {
  width: number;
  height: number;
}

interface States {
  cwd: string;
  tabs: ITab[];
  bufs: IBuffer[];
  menus: IMenu[];
  bookmarks: { path: string; name: string; selected: boolean; }[];
  mode?: IMode;
}

const whiteSpace: "nowrap" = "nowrap";
const styles = {
  scope: {
    display: "flex",
  },
  tab: {
    display: "flex",
    margin: "4px 4px 0 0",
    minWidth: 0,
    cursor: "default",
    overflow: "hidden",
    borderBottom: "2px solid",
    borderRadius: "4px 4px 0 0",
    boxShadow: "0 0 4px 0 rgba(0, 0, 0, 0.6)",
  },
  name: {
    maxWidth: 300,
    padding: "0 8px",
    textOverflow: "ellipsis",
    overflow: "hidden",
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
    alignItems: "center",
    height: "100%",
    padding: "0 4px",
    minWidth: 0,
    borderLeft: "solid 1px #646079",
  },
  space: {
    paddingLeft: 4,
  },
};

export class TablineComponent extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);
    this.state = { cwd: "", tabs: [], bufs: [], menus: [], bookmarks: Setting.bookmarks };

    Emit.on("envim:cwd", this.onCwd.bind(this));
    Emit.on("tabline:update", this.onTabline.bind(this));
    Emit.on("menu:update", this.onMenu.bind(this));
    Emit.on("mode:change", this.changeMode.bind(this));
  }

  componentWillUnmount() {
    Emit.clear(["envim:cwd", "tabline:update", "menu:update", "mode:change", "messages:mode", "messages:command", "messages:ruler"]);
  }

  private onCwd(cwd: string) {
    this.setState({ cwd });
  }

  private async saveBookmark(index: number, bookmark: { path: string, name: string, selected: boolean }) {
    const bookmarks = this.state.bookmarks;
    const args = ["input", ["Bookmark: ", bookmark.name]]

    bookmark.name = await Emit.sync<string>("envim:api", "nvim_call_function", args) || bookmark.name;
    index < 0 ? bookmarks.push(bookmark) : bookmarks.splice(index, 1, bookmark);
    Setting.bookmarks = bookmarks.sort((a, b) => a.name > b.name ? 1 : -1);

    this.setState({ bookmarks });
  }

  private deleteBookmark(index: number) {
    const bookmarks = this.state.bookmarks;

    bookmarks.splice(index, 1);
    Setting.bookmarks = bookmarks;

    this.setState({ bookmarks });
  }

  private runCommand(command: string) {
    Emit.send("envim:command", command);
  }

  private onTabline(tabs: ITab[], bufs: IBuffer[]) {
    this.setState({ tabs, bufs });
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

    const color = `${icon.color}-fg-dark`;
    const lineHeight = `${this.props.height - 4}px`;
    return (
      <div key={i} className={`animate fade-in color-${color}`} style={styles.tab}>
        <IconComponent color={color} style={{ ...styles.name, lineHeight }} active={tab.active} font={icon.font} text={tab.name.replace(/([^\/])[^\/]*\//g, "$1/")} onClick={() => this.runCommand(`tabnext ${i + 1}`,)} />
        <IconComponent color={icon.color} style={{ ...styles.space, lineHeight }} active={tab.active} font="" onClick={() => this.runCommand(this.state.tabs.length > 1 ? `tabclose! ${i + 1}` : "quitall")} />
      </div>
    );
  }

  private renderSubmenu(menu: IMenu) {
    const sname = this.state.mode?.short_name;
    return !sname ? null : (
      <div>
        { menu.submenus?.map((submenu, i) => {
          const command = `emenu ${menu.name.replace(/([\. ])/g, "\\$1")}.${submenu.name.replace(/([\. ])/g, "\\$1")}`;
          return submenu.mappings[sname]?.enabled && submenu.mappings[sname]?.rhs
            ? <div key={i} className="color-black clickable" onClick={() => this.runCommand(command)}>{ submenu.name }</div>
            : <div key={i} className="color-gray-fg-dark" onClick={() => this.runCommand("")}>{ submenu.name }</div>
        })}
      </div>
    );
  }

  private renderBookmark() {
    const cwd = this.state.cwd
    const index = this.state.bookmarks.findIndex(({ path }) => path === cwd);
    const { color, label, bookmark } = index >= 0
      ? { color: "blue-fg", label: "", bookmark: this.state.bookmarks[index] }
      : { color: "gray-fg", label: "", bookmark: { path: cwd, name: cwd, selected: false } };

    return (
        <MenuComponent color={color} style={this.getStyle(styles.space)} label={label}>
          <div className="color-gray-fg small">Path</div>
          <div className="color-white-fg">{ bookmark.path }</div>
          <div className="color-black divider" />
          <div className="color-gray-fg small">Name</div>
          <div className="color-white-fg">{ index < 0 ? "-" : bookmark.name }</div>
          <div className="color-black divider" />
          <div style={styles.scope}>
            <div className="space"></div>
            { index >= 0 && <IconComponent color="red-fg" style={styles.space} font="" onClick={() => this.deleteBookmark(index)} /> }
            <IconComponent color="blue-fg" font="" style={styles.space} onClick={() => this.saveBookmark(index, bookmark)} />
          </div>
        </MenuComponent>
    )
  }

  render() {
    return (
      <div className="color-black" style={{...this.props, ...styles.scope}}>
        {this.state.tabs.map((tab, i) => this.renderTab(i, tab))}
        <MenuComponent color="white-fg" style={this.getStyle(styles.space)} label="">
          { this.state.bufs.map(({ name, buffer, active }, i) => (
            <div className={`color-black ${active ? "active" : "clickable"}` }key={i} onClick={() => this.runCommand(`buffer ${buffer}`)}>
              { name } <IconComponent style={styles.space} color="red-fg" font="" onClick={() => this.runCommand(`bdelete! ${buffer}`)} />
            </div>
          )) }
        </MenuComponent>
        <MenuComponent color="green-fg" style={this.getStyle(styles.space)} onClick={() => this.runCommand("$tabnew")} label="">
          { this.state.bookmarks.map(({ name, path }, i) => <div className="color-black clickable" key={i} onClick={() => this.runCommand(`$tabnew | cd ${path}`)}>{ name }</div>) }
        </MenuComponent>
        { this.renderBookmark() }
        <div className="space dragable" />
        { this.state.menus.map((menu, i) => (
          <MenuComponent key={i} color="black" style={styles.menu} label={menu.name}>
            { this.renderSubmenu(menu) }
          </MenuComponent>
        ))}
      </div>
    );
  }
}
