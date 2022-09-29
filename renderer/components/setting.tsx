import React, { FormEvent, ChangeEvent } from "react";

import { Emit } from "../utils/emit";
import { Setting } from "../utils/setting";

interface Props {
  width: number;
  height: number;
}

interface States {
  type: "command" | "address";
  path: string;
  font: { width: number; height: number; size: number; lspace: number; scale: number; };
  opacity: number;
  options: { [k: string]: boolean; };
  bookmarks: { path: string; name: string; selected: boolean; }[];
}

const flexDirection: "column" = "column";
const position: "absolute" = "absolute";
const styles = {
  scope: {
    padding: 8,
    display: "flex",
    alignItems: "center",
    overflow: "auto",
    flexDirection,
  },
  backdrop: {
    width: "100%",
    height: "100%",
    top: 0,
    left: 0,
    position,
    zIndex: -1,
  },
  logo: {
    fontSize: "2em",
    lineHeight: "1em",
    margin: "0 6px",
  },
  icon: {
    margin: "0 6px",
  },
  button: {
    marginTop: "1em",
    padding: ".2em .4em",
    border: "none",
    borderRadius: ".2em",
  },
};

export class SettingComponent extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);
    this.state = { ...Setting.get() };
  }

  private onToggleType = (e: ChangeEvent) => {
    const type = (e.target as HTMLInputElement).value === "command" ? "command" : "address";

    if (type === this.state.type) {
      this.setState({ type });
    } else {
      this.setState({ ...Setting.loadCache(type, this.state.path) });
    }
  }

  private onChangePath = (e: ChangeEvent) => {
    const path = (e.target as HTMLInputElement).value;

    if (path === this.state.path) {
      this.setState({ path });
    } else {
      this.setState({ ...Setting.loadCache(this.state.type, path) });
    }
  }

  private onChangeFont = (e: ChangeEvent) => {
    const size = +(e.target as HTMLInputElement).value;
    this.setState({ font: { ...this.state.font, size } });
  }

  private onChangeLspace = (e: ChangeEvent) => {
    const lspace = +(e.target as HTMLInputElement).value;
    this.setState({ font: { ...this.state.font, lspace } });
  }

  private onChangeOpacity = (e: ChangeEvent) => {
    const opacity = +(e.target as HTMLInputElement).value;
    this.setState({ opacity });
  }

  private onToggleOption = (e: ChangeEvent) => {
    const input = e.target as HTMLInputElement;
    const options = this.state.options;
    options[input.name] = input.checked;
    this.setState({ options });
  }

  private onSelectBookmark(index: number) {
    const bookmarks = this.state.bookmarks.map((bookmark, i) => ({ ...bookmark, selected: i === index }));

    this.setState({ bookmarks });
  }

  private onSubmit = (e: FormEvent) => {
    const { type, path, font, opacity, options, bookmarks } = this.state;

    e.stopPropagation();
    e.preventDefault();

    Setting.type = type;
    Setting.path = path;
    Setting.font = { size: font.size, width: Math.floor(font.size * 0.6), height: font.size + font.lspace, lspace: font.lspace, scale: Math.ceil(window.devicePixelRatio) };
    Setting.opacity = opacity;
    Setting.options = options;
    Setting.bookmarks = bookmarks;
    Setting.saveCache();

    Emit.initialize();
    Emit.send("envim:connect", type, path, bookmarks.find(({ selected }) => selected)?.path);
  }

  private getStyle() {
    return {
      opacity: (100 - this.state.opacity) / 100,
      ...styles.backdrop,
    };
  }

  private getExampleStyle() {
    return {
      padding: "4px 8px",
      fontSize: this.state.font.size,
      lineHeight: `${this.state.font.height}px`,
    };
  }

  render() {
    return (
      <form className="color-inverse-fg" style={{ ...this.props, ...styles.scope }} onSubmit={this.onSubmit}>
        <div className="color-default" style={this.getStyle()}></div>
        <h1 className="bold">Welcome To Envim!</h1>
        <div>
          <i className="color-green-fg" style={styles.logo}></i>
          <i className="color-inverse-fg" style={styles.icon}></i>
          <i className="color-lightblue-fg" style={styles.logo}></i>
        </div>

        <div>
          <h3 className="bold">Neovim path</h3>
          <div>
            <label><input type="radio" value="command" checked={this.state.type === "command"} onChange={this.onToggleType} />Command</label>
            <label><input type="radio" value="address" checked={this.state.type === "address"} onChange={this.onToggleType} />Port</label>
          </div>
          <label>Enter neovim path<input type="text" value={this.state.path} onChange={this.onChangePath} autoFocus /></label>
          <div className="color-default divider" />

          <h3 className="bold">Appearance</h3>
          <div><label>Font Size ({this.state.font.size}px)<input type="range" min="5" max="20" value={this.state.font.size} onChange={this.onChangeFont} /></label></div>
          <div><label>Line Space ({this.state.font.lspace}px)<input type="range" min="0" max="10" value={this.state.font.lspace} onChange={this.onChangeLspace} /></label></div>
          <div style={this.getExampleStyle()}>Example Text</div>
          <div><label>Transparent ({this.state.opacity}%)<input type="range" min="0" max="50" value={this.state.opacity} onChange={this.onChangeOpacity} /></label></div>
          <div className="color-default divider" />

          <h3 className="bold">Options</h3>
          { Object.keys(this.state.options).map((key, i) => (
            <label key={i}><input type="checkbox" name={key} checked={this.state.options[key]} onChange={this.onToggleOption} />{ key }</label>
          ))}
          <div className="color-default divider" />

          <h3 className="bold">Bookmarks</h3>
          <div>
            <label><input type="radio" checked={!this.state.bookmarks.find(({ selected }) => selected)} onChange={() => this.onSelectBookmark(-1)} />Not select</label>
          </div>
          { this.state.bookmarks.map((bookmark, i) => (
            <div key={i}>
              <label><input type="radio" checked={bookmark.selected} onChange={() => this.onSelectBookmark(i)} />{ bookmark.name }</label>
            </div>
          ))}
        </div>

        <button className="color-blue clickable" style={styles.button}>Start</button>
      </form>
    );
  }
}
