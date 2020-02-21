import React, { FormEvent, ChangeEvent } from "react";

import { Emit } from "../utils/emit";
import { Localstorage } from "../utils/localstorage";
import { icons } from "../utils/icons";

interface Props {
  opacity: number;
  onChangeOpacity: (e: ChangeEvent) => void,
}

interface States {
  type: "command" | "address";
  command: string;
  address: string;
}

const flexDirection: "column" = "column";
const styles = {
  scope: {
    display: "flex",
    flexDirection,
    justifyContent: "center",
    alignItems: "center",
  },
  i: {
    margin: 8,
  },
  button: {
    fontSize: "1em",
    padding: ".2em .4em",
    border: "none",
    borderRadius: ".2em",
  },
};

export class SettingComponent extends React.Component<Props, States> {
  private ls: Localstorage<States> = new Localstorage<States>("setting", { type: "command", command: "", address: "" });

  constructor(props: Props) {
    super(props);
    this.state = this.ls.get();
  }

  private onToggle(e: ChangeEvent) {
    const type = (e.target as HTMLInputElement).value === "command" ? "command" : "address";
    this.setState({type: type});
  }

  private onChangeCommand(e: ChangeEvent) {
    const command = (e.target as HTMLInputElement).value;
    this.setState({ command });
  }

  private onChangePort(e: ChangeEvent) {
    const address = (e.target as HTMLInputElement).value;
    this.setState({ address });
  }

  private onSubmit(e: FormEvent) {
    e.stopPropagation();
    e.preventDefault();
    this.ls.set(this.state);
    Emit.send("envim:attach", this.state.type, this.state[this.state.type]);
  }

  render() {
    return (
      <form style={styles.scope} onSubmit={this.onSubmit.bind(this)}>
        <h1>Welcome To Envim!</h1>
        <div>
          <label><input type="radio" value="command" checked={this.state.type === "command"} onChange={this.onToggle.bind(this)} />Command</label>
          <label><input type="radio" value="address" checked={this.state.type === "address"} onChange={this.onToggle.bind(this)} />Port</label>
        </div>
        {this.state.type === "command"
          ?  <label>Enter neovim command<input type="text" value={this.state.command} onChange={this.onChangeCommand.bind(this)} autoFocus={true} /></label>
          :  <label>Enter neovim address<input type="text" value={this.state.address} onChange={this.onChangePort.bind(this)} autoFocus={true} /></label>
        }
        <div>
          <label>Transparent ({this.props.opacity}%)<input type="range" min="0" max="99" value={this.props.opacity} onChange={this.props.onChangeOpacity} /></label>
        </div>
        <div>
          {icons.map((icon, i) => <i key={i} style={{color: icon.color, ...styles.i}}>{icon.font}</i>)}
        </div>
        <button className="color-blue clickable" style={styles.button}>Start</button>
      </form>
    );
  }
}
