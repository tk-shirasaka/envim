import React, { FormEvent, ChangeEvent } from "react";

import { Emit } from "../utils/emit";
import { Setting } from "../utils/setting";

import { IconComponent } from "./icon";

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
  others: { [k: string]: boolean; };
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
    fontSize: "4em",
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
    document.title = 'Envim';
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
    const font = { size: size, width: size / 2, height: size + 1 };
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

  private onToggleOther(e: ChangeEvent) {
    const input = e.target as HTMLInputElement;
    const others = this.state.others;
    others[input.name] = input.checked;
    Setting.others = others;
    this.setState({ others });
  }

  private onSubmit(e: FormEvent) {
    e.stopPropagation();
    e.preventDefault();
    Emit.send("envim:attach", this.state.type, this.state.path, this.state.options);
  }

  private getStyle() {
    return {
      opacity: (100 - this.state.opacity) / 100,
      ...this.props,
      ...styles.scope
    };
  }

  private renderFontExample() {
    const style = {
      padding: "4px 8px",
      fontSize: this.state.font.size,
      lineHeight: `${this.state.font.height}px`,
    };

    return (
      <div style={style}>
        <span><IconComponent color="white-fg" style={styles.icon} font="" /> Normal</span>,
        <span className="bold"><IconComponent color="white-fg" style={styles.icon} font="" /> Bold</span>,
        <span className="italic"><IconComponent color="white-fg" style={styles.icon} font="" /> Italic</span>
      </div>
    );
  }

  render() {
    return (
      <form className="color-black" style={this.getStyle()} onSubmit={this.onSubmit.bind(this)}>
        <h1>Welcome To Envim!</h1>
        <div>
          <IconComponent color="green-fg" style={styles.logo} font=""/>
          <IconComponent color="white-fg" style={styles.icon} font="" />
          <IconComponent color="lightblue-fg" style={styles.logo} font="" />
        </div>

        <div>
          <h3>Neovim path</h3>
          <div>
            <label><input type="radio" value="command" checked={this.state.type === "command"} onChange={this.onToggleType.bind(this)} />Command</label>
            <label><input type="radio" value="address" checked={this.state.type === "address"} onChange={this.onToggleType.bind(this)} />Port</label>
          </div>
          <label>Enter neovim path<input type="text" value={this.state.path} onChange={this.onChangePath.bind(this)} autoFocus={true} /></label>

          <h3>Appearance</h3>
          <label>Font Size ({this.state.font.size}px)<input type="range" min="5" max="20" value={this.state.font.size} onChange={this.onChangeFont.bind(this)} /></label>
          {this.renderFontExample()}
          <label>Transparent ({this.state.opacity}%)<input type="range" min="0" max="99" value={this.state.opacity} onChange={this.onChangeOpacity.bind(this)} /></label>

          <h3>Options</h3>
          { Object.keys(this.state.options).map((key, i) => (
            <label key={i}><input type="checkbox" name={key} checked={this.state.options[key]} onChange={this.onToggleOption.bind(this)} />{ key }</label>
          ))}

          <h3>Others</h3>
          { Object.keys(this.state.others).map((key, i) => (
            <label key={i}><input type="checkbox" name={key} checked={this.state.others[key]} onChange={this.onToggleOther.bind(this)} />{ key }</label>
          ))}
        </div>

        <button className="color-blue clickable" style={styles.button}>Start</button>
      </form>
    );
  }
}
