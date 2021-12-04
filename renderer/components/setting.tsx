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
  font: { width: number; height: number; size: number; };
  opacity: number;
  options: { [k: string]: boolean; };
  bookmarks: { path: string; name: string; selected: boolean; }[];
}

const flexDirection: "column" = "column";
const boxSizing: "border-box" = "border-box";
const position: "absolute" = "absolute";
const styles = {
  scope: {
    padding: 8,
    display: "flex",
    alignItems: "center",
    overflow: "auto",
    flexDirection,
    boxSizing,
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

  private onToggleType(e: ChangeEvent) {
    const type = (e.target as HTMLInputElement).value === "command" ? "command" : "address";
    Setting.type = type;
    this.setState({ type });
  }

  private onChangePath(e: ChangeEvent) {
    const path = (e.target as HTMLInputElement).value;
    Setting.path = path;
    this.setState({ path });
  }

  private onChangeFont(e: ChangeEvent) {
    const size = +(e.target as HTMLInputElement).value;
    const font = { size: size, width: size / 2, height: Math.floor(size * 1.25) };
    Setting.font = font;
    this.setState({ font });
  }

  private onChangeOpacity(e: ChangeEvent) {
    const opacity = +(e.target as HTMLInputElement).value;
    Setting.opacity = opacity;
    this.setState({ opacity });
  }

  private onToggleOption(e: ChangeEvent) {
    const input = e.target as HTMLInputElement;
    const options = this.state.options;
    options[input.name] = input.checked;
    Setting.options = options;
    this.setState({ options });
  }

  private onSelectBookmark(index: number) {
    const bookmarks = this.state.bookmarks.map(bookmark => ({ ...bookmark, selected: false }));

    bookmarks[index].selected = true;
    Setting.bookmarks = bookmarks;
    this.setState({ bookmarks });
  }

  private onChangeBookmark(e: ChangeEvent) {
    const input = e.target as HTMLInputElement;
    const bookmarks = this.state.bookmarks;

    bookmarks[+input.name].name = input.value;
    Setting.bookmarks = bookmarks;
    this.setState({ bookmarks });
  }

  private onDeleteBookmark(index: number) {
    const bookmarks = this.state.bookmarks;

    bookmarks.splice(index, 1);
    Setting.bookmarks = bookmarks;
    this.setState({ bookmarks });
  }

  private onSubmit(e: FormEvent) {
    e.stopPropagation();
    e.preventDefault();
    Emit.send("envim:connect", this.state.type, this.state.path, this.state.bookmarks.find(({ selected }) => selected)?.path);
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
      <form className="color-white-fg" style={{ ...this.props, ...styles.scope }} onSubmit={this.onSubmit.bind(this)}>
        <div className="color-black" style={this.getStyle()}></div>
        <h1 className="bold">Welcome To Envim!</h1>
        <div>
          <i className="color-green-fg" style={styles.logo}></i>
          <i className="color-white-fg" style={styles.icon}></i>
          <i className="color-lightblue-fg" style={styles.logo}></i>
        </div>

        <div>
          <h3 className="bold">Neovim path</h3>
          <div>
            <label><input type="radio" value="command" checked={this.state.type === "command"} onChange={this.onToggleType.bind(this)} />Command</label>
            <label><input type="radio" value="address" checked={this.state.type === "address"} onChange={this.onToggleType.bind(this)} />Port</label>
          </div>
          <label>Enter neovim path<input type="text" value={this.state.path} onChange={this.onChangePath.bind(this)} autoFocus={true} /></label>

          <h3 className="bold">Appearance</h3>
          <label>Font Size ({this.state.font.size}px)<input type="range" min="5" max="20" value={this.state.font.size} onChange={this.onChangeFont.bind(this)} /></label>
          <div style={this.getExampleStyle()}>Example Text</div>
          <label>Transparent ({this.state.opacity}%)<input type="range" min="0" max="50" value={this.state.opacity} onChange={this.onChangeOpacity.bind(this)} /></label>

          <h3 className="bold">Options</h3>
          { Object.keys(this.state.options).map((key, i) => (
            <label key={i}><input type="checkbox" name={key} checked={this.state.options[key]} onChange={this.onToggleOption.bind(this)} />{ key }</label>
          ))}

          <h3 className="bold">Bookmarks</h3>
          { this.state.bookmarks.map((bookmark, i) => (
            <label key={i}>
              <input type="radio" checked={bookmark.selected} onChange={() => this.onSelectBookmark(i)} />
              <input type="text" name={`${i}`} value={bookmark.name} placeholder={bookmark.path} onChange={this.onChangeBookmark.bind(this)} />
              <i className="color-red-fg" style={styles.icon} onClick={() => this.onDeleteBookmark(i)}></i>
            </label>
          ))}
        </div>

        <button className="color-blue clickable" style={styles.button}>Start</button>
      </form>
    );
  }
}
