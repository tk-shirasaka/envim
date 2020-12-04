import React, { MouseEvent } from "react";

import { IMessage } from "../../../common/interface";

import { Emit } from "../../utils/emit";

import { MessageComponent } from "./message";

interface Props {
}

interface States {
  notificate: IMessage[];
  mode: IMessage[];
  command: IMessage[];
  ruler: IMessage[];
}

const position: "absolute" = "absolute";
const styles = {
  messages: {
    position,
    zIndex: 10,
    right: 0,
    width: 300,
    maxHeight: "100%",
    borderRadius: "0 0 0 4px",
    boxShadow: "8px 8px 4px 0 rgba(0, 0, 0, 0.6)",
    overflow: "auto",
    cursor: "pointer",
  },
};

export class NotificateComponent extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);

    this.state = { notificate: [], mode: [], command: [], ruler: [] };
    Emit.on("messages:notificate", this.onNotificate.bind(this));
    Emit.on("messages:mode", this.onMode.bind(this));
    Emit.on("messages:command", this.onCommand.bind(this));
    Emit.on("messages:ruler", this.onRuler.bind(this));
  }

  componentWillUnmount() {
    Emit.clear(["messages:notificate", "messages:mode", "messages:command", "messages:ruler"]);
  }

  private onNotificate(notificate: IMessage[]) {
    this.setState({ notificate });
  }

  private onMode(mode: IMessage[]) {
    this.setState({ mode });
  }

  private onCommand(command: IMessage[]) {
    this.setState({ command });
  }

  private onRuler(ruler: IMessage[]) {
    this.setState({ ruler });
  }

  private onClose(e: MouseEvent, type: string) {
    e.stopPropagation();
    e.preventDefault();

    if (type === "notificate") this.onNotificate([]);
    if (type === "mode") this.onMode([]);
    if (type === "command") this.onCommand([]);
    if (type === "ruler") this.onRuler([]);

    Emit.share("envim:focus");
  }

  render() {
    if (
      this.state.notificate.length === 0 &&
      this.state.mode.length === 0 &&
      this.state.command.length === 0 &&
      this.state.ruler.length === 0
    ) {
      return null;
    }

    return (
      <div className="animate slide-right" style={styles.messages}>
        <div onClick={e => this.onClose(e, "mode")}>
          {this.state.mode.map((message, i) => <MessageComponent {...message} key={i} />)}
        </div>

        <div onClick={e => this.onClose(e, "command")}>
          {this.state.command.map((message, i) => <MessageComponent {...message} key={i} />)}
        </div>

        <div onClick={e => this.onClose(e, "ruler")}>
          {this.state.ruler.map((message, i) => <MessageComponent {...message} key={i} />)}
        </div>

        <div onClick={e => this.onClose(e, "notificate")}>
          {this.state.notificate.map((message, i) => <MessageComponent {...message} key={i} />)}
        </div>
      </div>
    );
  }
}
