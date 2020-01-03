import React, { FormEvent, ChangeEvent } from "react";
import { ipcRenderer, IpcRendererEvent } from "electron";

import { Localstorage } from "../utils/localstorage";
import { IFont } from "../utils/interfaces";

interface Props {
  font: IFont;
  onChangeFont: (e: ChangeEvent) => void;
}

interface States {
  type: "cmd" | "port";
  cmd: string;
  port: string;
  cmdList: string[];
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
  private prevCmd: string = "";
  private ls: Localstorage<States> = new Localstorage<States>("setting", { type: "cmd", cmd: "", port: "", cmdList: [] });

  constructor(props: Props) {
    super(props);
    this.state = this.ls.get();

    ipcRenderer.on("setting:cmd-list", this.onCmdList.bind(this));
  }

  private onToggle(e: ChangeEvent) {
    const type = (e.target as HTMLInputElement).value === "cmd" ? "cmd" : "port";
    this.setState({type: type, cmdList: []});
  }

  private onChangeCmd(e: ChangeEvent) {
    const cmd = (e.target as HTMLInputElement).value;

    if (this.state.type === "cmd") {
      const timeout = +setTimeout(() => {
        if (cmd === this.prevCmd) return;
        if (!(cmd && timeout === this.timeout)) return;
        this.timeout = 0;
        this.prevCmd = cmd;
        ipcRenderer.send("setting:cmd", cmd);
      }, 500);
      this.timeout = timeout;
    }
    this.setState({ cmd });
  }

  private onChangePort(e: ChangeEvent) {
    const port = (e.target as HTMLInputElement).value;
    this.setState({ port });
  }

  private onCmdList(_: IpcRendererEvent, list: string[]) {
    this.setState({cmdList: list});
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
          <label><input style={styles.radio} type="radio" value="cmd" checked={this.state.type === "cmd"} onChange={this.onToggle.bind(this)} />Command</label>
          <label><input style={styles.radio} type="radio" value="port" checked={this.state.type === "port"} onChange={this.onToggle.bind(this)} />Port</label>
        </div>
        {this.state.type === "cmd"
          ?  <p><label>Enter neovim command<input style={styles.text} value={this.state.cmd} list="cmd-list" onChange={this.onChangeCmd.bind(this)} autoFocus={true} /></label></p>
          :  <p><label>Enter neovim port<input style={styles.text} value={this.state.port} onChange={this.onChangePort.bind(this)} autoFocus={true} /></label></p>
        }
        <datalist id="cmd-list">
          {this.state.cmdList.map(cmd => <option key={`list_${cmd}`} value={cmd} />)}
        </datalist>
        <p><label>Font size <input style={styles.text} name="size" value={this.props.font.size} onChange={this.props.onChangeFont} /></label></p>
        <p><label>Column space <input style={styles.text} name="width" value={this.props.font.width} onChange={this.props.onChangeFont} /></label></p>
        <button style={styles.button}>Start</button>
      </form>
    );
  }
}
