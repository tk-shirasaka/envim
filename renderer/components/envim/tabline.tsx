import React, { MouseEvent } from "react";

import { ITab, IBuffer, IMode, IMenu } from "../../../common/interface";

import { Emit } from "../../utils/emit";
import { Setting } from "../../utils/setting";
import { Buffers } from "../../utils/buffer";
import { icons } from "../../utils/icons";

import { FlexComponent } from "../flex";
import { IconComponent } from "../icon";
import { MenuComponent } from "../menu";

interface Props {
  height: number;
  padding: string;
}

interface States {
  cwd: string;
  tabs: ITab[];
  menus: IMenu[];
  bookmarks: { path: string; name: string; selected: boolean; }[];
  mode?: IMode;
}

const styles = {
  tab: {
    minWidth: 0,
    cursor: "pointer",
  },
  name: {
    maxWidth: 300,
    padding: "0",
  },
  menu: {
    padding: "2px 8px",
    minWidth: 0,
    cursor: "pointer",
  },
  space: {
    padding: "0 0 0 4px",
  },
};

export class TablineComponent extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);
    this.state = { cwd: "", tabs: [], menus: [], bookmarks: Setting.bookmarks };

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

    bookmark.name = await Emit.send<string>("envim:api", "nvim_call_function", args) || bookmark.name;
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

  private runCommand(e: MouseEvent, command: string) {
    e.stopPropagation();
    e.preventDefault();

    Emit.send("envim:command", command);
  }

  private onTabline(tabs: ITab[], bufs: IBuffer[]) {
    Buffers.set(bufs);
    this.setState({ tabs });
  }

  private onMenu(menus: IMenu[]) {
    menus = menus.filter(menu => !menu.hidden).map(menu => ({ ...menu, submenus: menu.submenus?.filter(submenu => !submenu.submenus && !submenu.hidden) }));
    this.setState({ menus });
  }

  private changeMode(mode: IMode) {
    this.setState({ mode });
  }

  private renderTab(i: number, tab: ITab) {
    const icon = icons.filter(icon => tab.filetype.search(icon.type) >= 0 || tab.buftype.search(icon.type) >= 0).shift();

    return !icon ? null : (
      <FlexComponent key={i} className={`animate fade-in hover color-${icon.color}-fg-dark clickable`} title={tab.name} shrink={1} margin={[4, 4, 0, 0]} padding={[0, 0, 0, 8]} rounded={[4, 4, 0, 0]} shadow={tab.active} style={styles.tab}>
        <IconComponent style={styles.name} font={icon.font} text={tab.name.replace(/.*\//, "…/")} onClick={e => this.runCommand(e, `tabnext ${i + 1}`,)} />
        <IconComponent color="gray-fg" style={styles.space} font="" onClick={e => this.runCommand(e, this.state.tabs.length > 1 ? `confirm tabclose ${i + 1}` : "confirm quitall")} hover />
      </FlexComponent>
    );
  }

  private renderSubmenu(menu: IMenu) {
    const sname = this.state.mode?.short_name;
    return !sname ? null : (
      <div>
        { menu.submenus?.map((submenu, i) => {
          const command = `emenu ${menu.name.replace(/([\. ])/g, "\\$1")}.${submenu.name.replace(/([\. ])/g, "\\$1")}`;
          return submenu.mappings[sname]?.enabled && submenu.mappings[sname]?.rhs
            ? <div key={i} className="color-black clickable" onClick={e => this.runCommand(e, command)}>{ submenu.name }</div>
            : <div key={i} className="color-gray-fg-dark" onClick={e => this.runCommand(e, "")}>{ submenu.name }</div>
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
        <MenuComponent color={color} style={styles.space} label={label}>
          <div className="color-gray-fg small">Path</div>
          <div className="color-white-fg">{ bookmark.path }</div>
          <div className="color-black divider" />
          <div className="color-gray-fg small">Name</div>
          <div className="color-white-fg">{ index < 0 ? "-" : bookmark.name }</div>
          <div className="color-black divider" />
          <FlexComponent horizontal="end">
            { index >= 0 && <IconComponent color="red-fg" style={styles.space} font="" onClick={() => this.deleteBookmark(index)} /> }
            <IconComponent color="blue-fg" font="" style={styles.space} onClick={() => this.saveBookmark(index, bookmark)} />
          </FlexComponent>
        </MenuComponent>
    )
  }

  render() {
    return (
      <FlexComponent className="color-black" overflow="visible" style={this.props} shadow>
        {this.state.tabs.map((tab, i) => this.renderTab(i, tab))}
        <MenuComponent color="green-fg" style={styles.space} onClick={e => this.runCommand(e, "$tabnew")} label="">
          { this.state.bookmarks.map(({ name, path }, i) => <div className="color-black clickable" key={i} onClick={e => this.runCommand(e, `$tabnew | cd ${path}`)}>{ name }</div>) }
        </MenuComponent>
        { this.renderBookmark() }
        <div className="space dragable" />
        { this.state.menus.map((menu, i) => (
          <MenuComponent key={i} color="black" style={styles.menu} label={menu.name}>
            { this.renderSubmenu(menu) }
          </MenuComponent>
        ))}
      </FlexComponent>
    );
  }
}
