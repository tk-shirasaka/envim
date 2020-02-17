import React, { FormEvent, ChangeEvent } from "react";
import { ipcRenderer } from "electron";

import { Localstorage } from "../utils/localstorage";
import { icons } from "../utils/icons";

interface Props {
}

interface States {
  type: "command" | "address";
  command: string;
  address: string;
  commandList: string[];
}

const flexDirection: "column" = "column";
const styles = {
  scope: {
    display: "flex",
    flexDirection,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    margin: 8,
  },
  radio: {
    margin: "0 8px",
  },
  text: {
    fontSize: "1em",
    margin: "auto .2em",
    padding: ".2em .4em",
    border: "none",
    borderRadius: ".2em",
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
  private ls: Localstorage<States> = new Localstorage<States>("setting", { type: "command", command: "", address: "", commandList: [] });

  constructor(props: Props) {
    super(props);
    this.state = this.ls.get();
    document.title = 'Envim';
  }

  private onToggle(e: ChangeEvent) {
    const type = (e.target as HTMLInputElement).value === "command" ? "command" : "address";
    this.setState({type: type, commandList: []});
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
    ipcRenderer.send("envim:attach", this.state.type, this.state[this.state.type]);
  }

  render() {
    return (
      <form style={styles.scope} onSubmit={this.onSubmit.bind(this)}>
        <h1>Welcome To Envim!</h1>
        <div>
          <label style={styles.label}><input style={styles.radio} type="radio" value="command" checked={this.state.type === "command"} onChange={this.onToggle.bind(this)} />Command</label>
          <label style={styles.label}><input style={styles.radio} type="radio" value="address" checked={this.state.type === "address"} onChange={this.onToggle.bind(this)} />Port</label>
        </div>
        {this.state.type === "command"
          ?  <label style={styles.label}>Enter neovim command<input style={styles.text} value={this.state.command} onChange={this.onChangeCommand.bind(this)} autoFocus={true} /></label>
          :  <label style={styles.label}>Enter neovim address<input style={styles.text} value={this.state.address} onChange={this.onChangePort.bind(this)} autoFocus={true} /></label>
        }
        <div>
          {icons.map((icon, i) => <i key={i} style={{color: icon.color, ...styles.i}}>{icon.font}</i>)}
        </div>
        <button className="color-blue clickable" style={styles.button}>Start</button>
      </form>
    );
  }
}
