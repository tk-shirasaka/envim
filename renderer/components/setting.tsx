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
}

const flexDirection: "column" = "column";
const boxSizing: "border-box" = "border-box";
const styles = {
  scope: {
    padding: 8,
    display: "flex",
    alignItems: "center",
    overflow: "auto",
    flexDirection,
    boxSizing,
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

  private onSubmit(e: FormEvent) {
    e.stopPropagation();
    e.preventDefault();
    Emit.send("envim:connect", this.state.type, this.state.path);
  }

  private getStyle() {
    return {
      opacity: (100 - this.state.opacity) / 100,
      ...this.props,
      ...styles.scope
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
      <form className="color-black" style={this.getStyle()} onSubmit={this.onSubmit.bind(this)}>
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
        </div>

        <button className="color-blue clickable" style={styles.button}>Start</button>
      </form>
    );
  }
}
