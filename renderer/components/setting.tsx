import React, { FormEvent, ChangeEvent } from "react";

import { Emit } from "../utils/emit";
import { Setting } from "../utils/setting";

import { IconComponent } from "./icon";

interface Props {
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
const styles = {
  scope: {
    display: "flex",
    flexDirection,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    margin: "0 8px",
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

  render() {
    return (
      <form style={styles.scope} onSubmit={this.onSubmit.bind(this)}>
        <h1>Welcome To Envim!</h1>
        <div>
          <IconComponent color="green-fg" style={styles.icon} font="" raito={3} />
          <IconComponent color="white-fg" style={styles.icon} font="" />
          <IconComponent color="lightblue-fg" style={styles.icon} font="" raito={3} />
        </div>

        <h3>Path to neovim</h3>
        <div>
          <label><input type="radio" value="command" checked={this.state.type === "command"} onChange={this.onToggleType.bind(this)} />Command</label>
          <label><input type="radio" value="address" checked={this.state.type === "address"} onChange={this.onToggleType.bind(this)} />Port</label>
        </div>
        <label>Enter neovim path<input type="text" value={this.state.path} onChange={this.onChangePath.bind(this)} autoFocus={true} /></label>
        <label>Font Size ({this.state.font.size}px)<input type="range" min="5" max="20" value={this.state.font.size} onChange={this.onChangeFont.bind(this)} /></label>
        <label>Transparent ({this.state.opacity}%)<input type="range" min="0" max="99" value={this.state.opacity} onChange={this.onChangeOpacity.bind(this)} /></label>

        <h3>Options</h3>
        { Object.keys(this.state.options).map((key, i) => (
          <label key={i}><input type="checkbox" name={key} checked={this.state.options[key]} onChange={this.onToggleOption.bind(this)} />{ key }</label>
        ))}

        <h3>Others</h3>
        { Object.keys(this.state.others).map((key, i) => (
          <label key={i}><input type="checkbox" name={key} checked={this.state.others[key]} onChange={this.onToggleOther.bind(this)} />{ key }</label>
        ))}

        <button className="color-blue clickable" style={styles.button}>Start</button>
      </form>
    );
  }
}
