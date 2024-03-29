import React, { FormEvent, ChangeEvent } from "react";

import { ISetting } from "common/interface";

import { Emit } from "../utils/emit";
import { Setting } from "../utils/setting";

interface Props {
  width: number;
  height: number;
}

interface States extends ISetting {
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
  setting: {
    padding: "1rem",
    height: "100%",
    overflow: "auto",
  },
  button: {
    marginTop: "1em",
    padding: ".5em 1em",
    borderWidth: 1,
    borderRadius: ".2em",
  },
};

export class SettingComponent extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);
    this.state = { ...Setting.get() };

    Emit.on("envim:setting", this.onSetting);
    Emit.send("envim:init");
  }

  componentWillUnmount = () => {
    Emit.off("envim:setting", this.onSetting);
  }

  private onSetting = (state: ISetting) => {
    this.setState(() => state);
  }

  private onToggleType = (e: ChangeEvent<HTMLInputElement>) => {
    this.setState(state => {
      const type = e.target.value as ISetting["type"];
      const path = state.path;
      const { presets, searchengines, ...rest } = state.presets[`[${type}]:${path}`] || { type, path };

      return { ...state, ...rest };
    });
  }

  private onChangePath = (e: ChangeEvent<HTMLInputElement>) => {
    this.setState(state => {
      const path = e.target.value;
      const type = state.type;
      const { presets, searchengines, ...rest } = state.presets[`[${type}]:${path}`] || { type, path };

      return { ...state, ...rest };
    });
  }

  private onChangeFont = (e: ChangeEvent<HTMLInputElement>) => {
    this.setState(state => ({ font: { ...state.font, size: +e.target.value } }));
  }

  private onChangeLspace = (e: ChangeEvent<HTMLInputElement>) => {
    this.setState(state => ({ font: { ...state.font, lspace: +e.target.value } }));
  }

  private onChangeOpacity = (e: ChangeEvent<HTMLInputElement>) => {
    this.setState(() => ({ opacity: +e.target.value }));
  }

  private onToggleOption = (e: ChangeEvent<HTMLInputElement>) => {
    this.setState(({ options }) => {
      options[e.target.name] = e.target.checked;

      return { options };
    });
  }

  private onSelectBookmark(index: number) {
    this.setState(state => ({
      bookmarks: state.bookmarks.map((bookmark, i) => ({ ...bookmark, selected: i === index }))
    }));
  }

  private onSelectPreset(key: string) {
    this.setState(({ searchengines, presets }) => ({ ...presets[key], searchengines, presets }));
  }

  private onSubmit = (e: FormEvent) => {
    const { type, path, font, opacity, options, bookmarks, searchengines } = this.state;

    e.stopPropagation();
    e.preventDefault();

    Setting.type = type;
    Setting.path = path;
    Setting.font = { size: font.size, width: Math.floor(font.size * 0.6), height: font.size + font.lspace, lspace: font.lspace, scale: Math.ceil(window.devicePixelRatio) };
    Setting.opacity = opacity;
    Setting.options = options;
    Setting.bookmarks = bookmarks;
    Setting.searchengines = searchengines;

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
          <i className="color-inverse-fg" style={styles.icon}>󰅖</i>
          <i className="color-lightblue-fg" style={styles.logo}></i>
        </div>

        <div style={styles.setting}>
          <h3 className="bold">Neovim path</h3>
          <div>
            <label><input type="radio" value="command" checked={this.state.type === "command"} onChange={this.onToggleType} />Command</label>
            <label><input type="radio" value="address" checked={this.state.type === "address"} onChange={this.onToggleType} />Server</label>
            <label><input type="radio" value="docker" checked={this.state.type === "docker"} onChange={this.onToggleType} />Docker</label>
            <label><input type="radio" value="ssh" checked={this.state.type === "ssh"} onChange={this.onToggleType} />SSH</label>
          </div>
          <label>Enter neovim path<input type="text" value={this.state.path} onChange={this.onChangePath} autoFocus /></label>
          <div className="color-gray divider" />

          <h3 className="bold">Appearance</h3>
          <div><label>Font Size ({this.state.font.size}px)<input type="range" min="5" max="20" value={this.state.font.size} onChange={this.onChangeFont} /></label></div>
          <div><label>Line Space ({this.state.font.lspace}px)<input type="range" min="0" max="10" value={this.state.font.lspace} onChange={this.onChangeLspace} /></label></div>
          <div style={this.getExampleStyle()}>Example Text</div>
          <div><label>Transparent ({this.state.opacity}%)<input type="range" min="0" max="50" value={this.state.opacity} onChange={this.onChangeOpacity} /></label></div>
          <div className="color-gray divider" />

          <h3 className="bold">Options</h3>
          { Object.keys(this.state.options).map((key, i) => (
            <label key={i}><input type="checkbox" name={key} checked={this.state.options[key]} onChange={this.onToggleOption} />{ key }</label>
          ))}
          <div className="color-gray divider" />

          <h3 className="bold">Bookmarks</h3>
          <div>
            <label><input type="radio" checked={!this.state.bookmarks.find(({ selected }) => selected)} onChange={() => this.onSelectBookmark(-1)} />Not select</label>
          </div>
          { this.state.bookmarks.map((bookmark, i) => (
            <div key={i}>
              <label><input type="radio" checked={bookmark.selected} onChange={() => this.onSelectBookmark(i)} />{ bookmark.name.replace(/\//g, "  ") }</label>
            </div>
          ))}

          <h3 className="bold">Presets</h3>
          { Object.keys(this.state.presets).map(key => (
            <div key={key}>
              <label><input type="radio" checked={`[${this.state.type}]:${this.state.path}` === key} onChange={() => this.onSelectPreset(key)} />{ key }</label>
            </div>
          ))}
        </div>

        <button className="color-blue clickable" style={styles.button}>Start</button>
      </form>
    );
  }
}
