import React, { MouseEvent } from "react";

import { ISetting, ITab, IBuffer, IMode, IMenu } from "../../../common/interface";

import { Emit } from "../../utils/emit";
import { Setting } from "../../utils/setting";
import { icons } from "../../utils/icons";

import { FlexComponent } from "../flex";
import { IconComponent } from "../icon";
import { MenuComponent } from "../menu";

interface Props {
  width: number;
  height: number;
  paddingLeft: number;
}

interface States {
  cwd: string;
  tabs: ITab[];
  menus: IMenu[];
  bookmarks: ISetting["bookmarks"];
  mode?: IMode;
  enabled: boolean;
}

const styles = {
  tab: {
    width: 150,
    minWidth: "2rem",
    cursor: "pointer",
  },
};

export class TablineComponent extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);
    this.state = { cwd: "", tabs: [], menus: [], bookmarks: Setting.bookmarks, enabled : Setting.options.ext_tabline };

    Emit.on("envim:cwd", this.onCwd);
    Emit.on("tabline:update", this.onTabline);
    Emit.on("menu:update", this.onMenu);
    Emit.on("mode:change", this.changeMode);
    Emit.on("option:set", this.onOption);
  }

  componentWillUnmount = () => {
    Emit.off("envim:cwd", this.onCwd);
    Emit.off("tabline:update", this.onTabline);
    Emit.off("menu:update", this.onMenu);
    Emit.off("mode:change", this.changeMode);
    Emit.off("option:set", this.onOption);
  }

  private onCwd = (cwd: string) => {
    const bookmarks = Setting.bookmarks;
    const current = bookmarks.find(({ selected }) => selected);
    const selected = bookmarks
      .filter(({ path }) => cwd.indexOf(path) === 0)
      .sort((a, b) => a.path.length - b.path.length)
      .pop();
    Setting.bookmarks = bookmarks.map(bookmark => ({ ...bookmark, selected: bookmark === selected }));

    this.setState({ cwd, bookmarks: Setting.bookmarks });
    selected && current !== selected && Emit.send("envim:connect", Setting.type, Setting.path, selected.path);
  }

  private async saveBookmark(bookmark: { name: string, path: string, selected: boolean }) {
    const bookmarks = this.state.bookmarks
      .filter(({ path }) => bookmark.path !== path)
      .map(bookmark => ({ ...bookmark, selected: false }));
    const args = ["EnvimInput", ["Bookmark", bookmark.name]]
    const name = await Emit.send<string>("envim:api", "nvim_call_function", args);

    if (name) {
      bookmark.name = name.replace(/^\//, "").replace(/\/+/, "/").replace(/\/$/, "");
      bookmarks.push(bookmark);
      Setting.bookmarks = bookmarks.sort((a, b) => a.name > b.name ? 1 : -1);

      this.onCwd(this.state.cwd);
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

  private onOption = (options: { ext_tabline: boolean }) => {
    options.ext_tabline === undefined || this.setState({ enabled: options.ext_tabline });
  }

  private renderTab(i: number, tab: ITab) {
    const icon = icons.filter(icon => tab.filetype.search(icon.type) >= 0 || tab.buftype.search(icon.type) >= 0).shift();

    return !icon ? null : (
      <FlexComponent key={i} animate="fade-in hover" color={icon.color} active={tab.active} title={tab.name} shrink={1} margin={[4, 4, 0, 0]} padding={[0, 8]} rounded={[4, 4, 0, 0]} shadow={tab.active} style={styles.tab} nomouse={this.state.tabs.length === 1} onClick={e => this.runCommand(e, `tabnext ${i + 1}`,)}>
        <IconComponent font={icon.font} text={tab.name.replace(/.*\//, "…/")} />
        <IconComponent color="gray" font="" float="right" onClick={e => this.runCommand(e, `confirm tabclose ${i + 1}`)} hover />
      </FlexComponent>
    );
  }

  private renderSubmenu(menus: IMenu[], base: string[]) {
    const sname = this.state.mode?.short_name;

    return !sname ? null : menus.map((menu, i) => {
      const command = [ ...base, menu.name.replace(/([\. ])/g, "\\$1") ];

      return menu.submenus?.length ? (
        <MenuComponent key={i} side={base.length > 0} label={menu.name}>
          { this.renderSubmenu(menu.submenus, command)}
        </MenuComponent>
      ) : (
        menu.mappings[sname]?.enabled && menu.mappings[sname]?.rhs
          ? <FlexComponent key={i} onClick={e => this.runCommand(e, `emenu ${command.join(".")}`)} spacing>{ menu.name }</FlexComponent>
          : <FlexComponent key={i} color="gray-fg" spacing>{ menu.name }</FlexComponent>
      );
    });
  }

  private renderBookmark() {
    const cwd = this.state.cwd
    const index = this.state.bookmarks.findIndex(({ selected }) => selected);
    const bookmark = index >= 0 ? this.state.bookmarks[index] : { name: cwd, group: "", path: cwd, selected: false };
    const text = bookmark.selected && bookmark.name.split("/").pop() || "";
    const icon = index >= 0 ? { color: "blue-fg", font: "", text } : { color: "gray-fg", font: "", text };

    return <IconComponent { ...icon } onClick={() => this.saveBookmark(bookmark)} />;
  }

  private renderBookmarkMenu(base: string) {
    const regexp = new RegExp(`^${base}`);
    const bookmarks = this.state.bookmarks.filter(({ name }) => name.match(regexp)).map(({ name, ...other }) => ({ ...other, name: name.replace(regexp, "") }));
    const groups = bookmarks.map(({ name }) => name.split("/")).reduce((all, curr) => curr.length === 1 || all.indexOf(curr[0]) >= 0 ? all : [...all, curr[0]], []);
    const selected = this.state.bookmarks.find(({ selected }) => selected)?.name || "";

    return (
      <>
        { groups.map(group =>
          <MenuComponent key={`${base}${group}`} color="lightblue-fg" label={`󰉋 ${group}`} active={selected.indexOf(`${base}${group}/`) === 0} side>
            { this.renderBookmarkMenu(`${base}${group}/`) }
          </MenuComponent>
        ) }
        { bookmarks.filter(({ name }) => name.split("/").length === 1).map(({ name, path, selected }, i) =>
          <FlexComponent animate="hover" direction="column" active={selected} key={`${base}-${i}`} onClick={e => this.runCommand(e, `cd ${path}`)} spacing>
            { name }
            <div className="color-gray-fg small">{ path }</div>
            <IconComponent color="gray" font="" float="right" onClick={e => this.deleteBookmark(e, path)} hover />
          </FlexComponent>
        ) }
      </>
    );
  }

  render() {
    return (
      <FlexComponent color="default" overflow="visible" zIndex={1} style={this.props} shadow>
        {this.state.enabled && this.state.tabs.map((tab, i) => this.renderTab(i, tab))}
        <IconComponent color="green-fg" font="" onClick={e => this.runCommand(e, "$tab split")} />
        <MenuComponent color="lightblue-fg" label="󰉋">
          { this.renderBookmarkMenu("") }
        </MenuComponent>
        { this.renderBookmark() }
        <div className="space dragable" />
        { this.renderSubmenu(this.state.menus, []) }
        <IconComponent color="gray-fg" font="" onClick={e => this.runCommand(e, "confirm quitall")} />
      </FlexComponent>
    );
  }
}
