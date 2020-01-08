import React, { FormEvent, ChangeEvent } from "react";
import { ipcRenderer, IpcRendererEvent } from "electron";

import { Localstorage } from "../utils/localstorage";

interface Props {
  font: { size: number; width: number; height: number; };
  onChangeFont: (e: ChangeEvent) => void;
}

interface States {
  type: "command" | "address";
  command: string;
  address: string;
  commandList: string[];
}

const styles = {
  scope: {
  },
  radio: {
    verticalAlign: "top",
    margin: ".3em .5em auto 1em",
  },
  text: {
    fontSize: "1em",
    margin: "auto .2em",
    padding: ".2em .4em",
    border: "none",
    borderRadius: ".2em",
  },
  button: {
    fontSize: "1em",
    margin: "auto .2em",
    padding: ".2em .4em",
    border: "none",
    borderRadius: ".2em",
    background: "#6dc2e6",
  },
};

export class SettingComponent extends React.Component<Props, States> {
  private timeout: number = 0;
  private prevCommand: string = "";
  private ls: Localstorage<States> = new Localstorage<States>("setting", { type: "command", command: "", address: "", commandList: [] });

  constructor(props: Props) {
    super(props);
    this.state = this.ls.get();

    ipcRenderer.on("setting:command-list", this.onCommandList.bind(this));
  }

  componentWillUnmount() {
    ipcRenderer.removeAllListeners("setting:command-list");
  }

  private onToggle(e: ChangeEvent) {
    const type = (e.target as HTMLInputElement).value === "command" ? "command" : "address";
    this.setState({type: type, commandList: []});
  }

  private onChangeCommand(e: ChangeEvent) {
    const command = (e.target as HTMLInputElement).value;

    if (this.state.type === "command") {
      const timeout = +setTimeout(() => {
        if (command === this.prevCommand) return;
        if (!(command && timeout === this.timeout)) return;
        this.timeout = 0;
        this.prevCommand = command;
        ipcRenderer.send("setting:command", command);
      }, 500);
      this.timeout = timeout;
    }
    this.setState({ command });
  }

  private onChangePort(e: ChangeEvent) {
    const address = (e.target as HTMLInputElement).value;
    this.setState({ address });
  }

  private onCommandList(_: IpcRendererEvent, list: string[]) {
    this.setState({commandList: list});
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
          <label><input style={styles.radio} type="radio" value="command" checked={this.state.type === "command"} onChange={this.onToggle.bind(this)} />Command</label>
          <label><input style={styles.radio} type="radio" value="address" checked={this.state.type === "address"} onChange={this.onToggle.bind(this)} />Port</label>
        </div>
        {this.state.type === "command"
          ?  <p><label>Enter neovim command<input style={styles.text} value={this.state.command} list="command-list" onChange={this.onChangeCommand.bind(this)} autoFocus={true} /></label></p>
          :  <p><label>Enter neovim address<input style={styles.text} value={this.state.address} onChange={this.onChangePort.bind(this)} autoFocus={true} /></label></p>
        }
        <datalist id="command-list">
          {this.state.commandList.map(command => <option key={`list_${command}`} value={command} />)}
        </datalist>
        <p><label>Font size <input style={styles.text} name="size" value={this.props.font.size} onChange={this.props.onChangeFont} /></label></p>
        <p><label>Column space <input style={styles.text} name="width" value={this.props.font.width} onChange={this.props.onChangeFont} /></label></p>
        <button style={styles.button}>Start</button>
      </form>
    );
  }
}
