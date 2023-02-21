import React, { MouseEvent } from "react";

import { ITab, IBuffer, IMode, IMenu } from "../../../common/interface";

import { Emit } from "../../utils/emit";
import { Setting } from "../../utils/setting";
import { icons } from "../../utils/icons";

import { FlexComponent } from "../flex";
import { IconComponent } from "../icon";
import { MenuComponent } from "../menu";

interface Props {
  width: number;
  height: number;
  padding: string;
}

interface States {
  cwd: string;
  tabs: ITab[];
  menus: IMenu[];
  bookmarks: { name: string; path: string; selected: boolean; }[];
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

    Emit.on("envim:cwd", this.onCwd);
    Emit.on("tabline:update", this.onTabline);
    Emit.on("menu:update", this.onMenu);
    Emit.on("mode:change", this.changeMode);
  }

  componentWillUnmount = () => {
    Emit.off("envim:cwd", this.onCwd);
    Emit.off("tabline:update", this.onTabline);
    Emit.off("menu:update", this.onMenu);
    Emit.off("mode:change", this.changeMode);
  }

  private onCwd = (cwd: string) => {
    Setting.bookmarks = this.state.bookmarks
      .map(bookmark => ({ ...bookmark, selected: bookmark.path === cwd }));

    this.setState({ cwd, bookmarks: Setting.bookmarks });
  }

  private async saveBookmark(bookmark: { name: string, path: string, selected: boolean }) {
    const bookmarks = this.state.bookmarks
      .map(bookmark => ({ ...bookmark, selected: false }))
      .filter(({ path }) => bookmark.path !== path);
    const args = ["input", ["Bookmark: ", bookmark.name]]
    const name = await Emit.send<string>("envim:api", "nvim_call_function", args);

    if (name) {
      bookmark.name = name.replace(/^\//, "").replace(/\/+/, "/").replace(/\/$/, "");
      bookmark.selected = bookmark.path === this.state.cwd;
      bookmarks.push(bookmark);
      Setting.bookmarks = bookmarks.sort((a, b) => a.name > b.name ? 1 : -1);

      this.setState({ bookmarks });
    }
  }

  private deleteBookmark(e: MouseEvent, path: string) {
    const bookmarks = this.state.bookmarks.filter(bookmark => bookmark.path !== path);

    e.stopPropagation();
    e.preventDefault();

    Setting.bookmarks = bookmarks;
    this.setState({ bookmarks });
  }

  private runCommand(e: MouseEvent, command: string) {
    e.stopPropagation();
    e.preventDefault();

    Emit.send("envim:command", command);
  }

  private onTabline = (tabs: ITab[], _: IBuffer[]) => {
    this.setState({ tabs });
  }

  private onMenu = (menus: IMenu[]) => {
    this.setState({ menus });
  }

  private changeMode = (mode: IMode) => {
    this.setState({ mode });
  }

  private renderTab(i: number, tab: ITab) {
    const icon = icons.filter(icon => tab.filetype.search(icon.type) >= 0 || tab.buftype.search(icon.type) >= 0).shift();

    return !icon ? null : (
      <FlexComponent key={i} animate="fade-in hover" color={icon.color} active={tab.active} title={tab.name} shrink={1} margin={[4, 4, 0, 0]} padding={[0, 0, 0, 8]} rounded={[4, 4, 0, 0]} shadow={tab.active} style={styles.tab} onClick={e => this.runCommand(e, `tabnext ${i + 1}`,)}>
        <IconComponent style={styles.name} font={icon.font} text={tab.name.replace(/.*\//, "…/")} />
        <IconComponent color="gray-fg" style={styles.space} font="" onClick={e => this.runCommand(e, this.state.tabs.length > 1 ? `confirm tabclose ${i + 1}` : "confirm quitall")} hover />
      </FlexComponent>
    );
  }

  private renderSubmenu(menus: IMenu[], base: string[]) {
    const sname = this.state.mode?.short_name;

    return !sname ? null : menus.map((menu, i) => {
      const command = [ ...base, menu.name.replace(/([\. ])/g, "\\$1") ];

      return menu.submenus?.length ? (
        <MenuComponent key={i} side={base.length > 0} color="default" style={base.length ? {} : styles.menu} label={menu.name}>
          { this.renderSubmenu(menu.submenus, command)}
        </MenuComponent>
      ) : (
        menu.mappings[sname]?.enabled && menu.mappings[sname]?.rhs
          ? <FlexComponent key={i} color="default" onClick={e => this.runCommand(e, `emenu ${command.join(".")}`)}>{ menu.name }</FlexComponent>
          : <FlexComponent key={i} color="gray-fg">{ menu.name }</FlexComponent>
      );
    });
  }

  private renderBookmark() {
    const cwd = this.state.cwd
    const index = this.state.bookmarks.findIndex(({ path }) => path === cwd);
    const bookmark = index >= 0 ? this.state.bookmarks[index] : { name: cwd, group: "", path: cwd, selected: false };
    const icon = index >= 0 ? { color: "blue-fg", label: "" } : { color: "gray-fg", label: "" };
    const selected = bookmark.selected && bookmark.name.split("/").pop();

    return (
      <MenuComponent { ...icon } style={styles.space} onClick={() => this.saveBookmark(bookmark)}>
        { selected && <FlexComponent color="blue" margin={[-4, -4, 4]} padding={[4]} border={[0, 0, 2]}>{ selected }</FlexComponent> }
        { this.renderBookmarkMenu() }
      </MenuComponent>
    )
  }

  private renderBookmarkMenu(base: string = "") {
    const regexp = new RegExp(`^${base}`);
    const bookmarks = this.state.bookmarks.filter(({ name }) => name.match(regexp)).map(({ name, ...other }) => ({ ...other, name: name.replace(regexp, "") }));
    const groups = bookmarks.map(({ name }) => name.split("/")).reduce((all, curr) => curr.length === 1 || all.indexOf(curr[0]) >= 0 ? all : [...all, curr[0]], []);

    return (
      <>
        { groups.map(group =>
          <MenuComponent key={`${base}${group}`} color="lightblue-fg" style={{}} label={` ${group}`} side>
            { this.renderBookmarkMenu(`${base}${group}/`) }
          </MenuComponent>
        ) }
        { bookmarks.filter(({ name }) => name.split("/").length === 1).map(({ name, path, selected }, i) =>
          <FlexComponent animate="hover" color="default" active={selected} key={`${base}-${i}`} onClick={e => this.runCommand(e, `cd ${path}`)}>
            <FlexComponent grow={1} direction="column" padding={[0, 8, 0, 0]}>
              { name }
              <div className="color-gray-fg small">{ path }</div>
            </FlexComponent>
            <IconComponent color="gray-fg" font="" onClick={e => this.deleteBookmark(e, path)} hover />
          </FlexComponent>
        ) }
      </>
    );
  }

  render() {
    return (
      <FlexComponent color="default" overflow="visible" style={this.props} shadow>
        {this.state.tabs.map((tab, i) => this.renderTab(i, tab))}
        <IconComponent color="green-fg" font="" style={styles.space} onClick={e => this.runCommand(e, "$tabnew")} />
        { this.renderBookmark() }
        <div className="space dragable" />
        { this.renderSubmenu(this.state.menus, []) }
      </FlexComponent>
    );
  }
}
