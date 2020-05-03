import React, { FormEvent, ChangeEvent } from "react";

import { Emit } from "../utils/emit";
import { Localstorage } from "../utils/localstorage";

import { IconComponent } from "./icon";

interface Props {
  opacity: number;
  onChangeOpacity: (e: ChangeEvent) => void,
}

interface States {
  type: "command" | "address";
  command: string;
  address: string;
  options: { [k: string]: boolean; }
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
  private ls: Localstorage<States> = new Localstorage<States>("setting", {
    type: "command", command: "", address: "", options: { ext_cmdline: true, ext_tabline: true, ext_popupmenu: true, ext_messages: true },
  });

  constructor(props: Props) {
    super(props);
    this.state = this.ls.get();
    document.title = 'Envim';
  }

  private onToggleType(e: ChangeEvent) {
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

  private onToggleOption(e: ChangeEvent) {
    const input = e.target as HTMLInputElement;
    const options = this.state.options;
    options[input.name] = input.checked;
    this.setState({ options });
  }

  private onSubmit(e: FormEvent) {
    e.stopPropagation();
    e.preventDefault();
    this.ls.set(this.state);
    Emit.send("envim:attach", this.state.type, this.state[this.state.type], this.state.options);
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
        <div>
          <label><input type="radio" value="command" checked={this.state.type === "command"} onChange={this.onToggleType.bind(this)} />Command</label>
          <label><input type="radio" value="address" checked={this.state.type === "address"} onChange={this.onToggleType.bind(this)} />Port</label>
        </div>
        {this.state.type === "command"
          ?  <label>Enter neovim command<input type="text" value={this.state.command} onChange={this.onChangeCommand.bind(this)} autoFocus={true} /></label>
          :  <label>Enter neovim address<input type="text" value={this.state.address} onChange={this.onChangePort.bind(this)} autoFocus={true} /></label>
        }
        <label>Transparent ({this.props.opacity}%)<input type="range" min="0" max="99" value={this.props.opacity} onChange={this.props.onChangeOpacity} /></label>
        <h3>Options</h3>
        <label><input type="checkbox" name="ext_cmdline" checked={this.state.options.ext_cmdline} onChange={this.onToggleOption.bind(this)} />ext_cmdline</label>
        <label><input type="checkbox" name="ext_tabline" checked={this.state.options.ext_tabline} onChange={this.onToggleOption.bind(this)} />ext_tabline</label>
        <label><input type="checkbox" name="ext_popupmenu" checked={this.state.options.ext_popupmenu} onChange={this.onToggleOption.bind(this)} />ext_popupmenu</label>
        <label><input type="checkbox" name="ext_messages" checked={this.state.options.ext_messages} onChange={this.onToggleOption.bind(this)} />ext_messages</label>

        <button className="color-blue clickable" style={styles.button}>Start</button>
      </form>
    );
  }
}
