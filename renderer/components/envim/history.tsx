import React from "react";

import { IMessage } from "../../../common/interface";

import { Emit } from "../../utils/emit";
import { Highlights } from "../../utils/highlight";

import { IconComponent } from "../icon";
import { MessageComponent } from "./message";

interface Props {
  width: number;
  height: number;
}

interface States {
  filter: string[],
  messages: IMessage[];
}

const positionF: "absolute" = "absolute";
const positionS: "sticky" = "sticky";
const styles = {
  scope: {
    position: positionF,
    zIndex: 10,
    bottom: 0,
    borderRadius: "4px 0 0 0",
    boxShadow: "8px -8px 4px 0 rgba(0, 0, 0, 0.6)",
    overflow: "auto",
  },
  actions: {
    position: positionS,
    display: "flex",
    top: 0,
  },
  icon: {
    padding: "2px 4px",
  },
};

export class HistoryComponent extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);

    this.state = { filter: [], messages: [] };
    Emit.on("messages:history", this.onHistory.bind(this));
  }

  componentWillUnmount() {
    Emit.clear(["messages:history"]);
  }

  private onClear() {
    Emit.send("envim:command", "messages clear");
    this.setState({ messages: [] });
  }

  private onClose() {
    this.setState({ messages: [] });
  }

  private onHistory(messages: IMessage[]) {
    if (this.state.messages.length === 0 && messages.length > 0) {
      const id = setInterval(() => {
        this.state.messages.length
          ?  Emit.send("envim:command", "messages")
          : clearInterval(id);

      }, 500);
    }
    this.setState({ messages });
  }

  render() {
    return this.state.messages.length > 0 && (
      <div className="animate slide-up" style={{...styles.scope, ...this.props, ...Highlights.style(0)}}>
        <div className="color-white" style={styles.actions}>
          <div className="space" />
          <IconComponent color="red-fg" style={styles.icon} font="ﰸ" onClick={this.onClear.bind(this)} />
          <IconComponent color="black-fg" style={styles.icon} font="" onClick={this.onClose.bind(this)} />
        </div>
        {this.state.messages.map((message, i) => (
          (this.state.filter.length && this.state.filter.indexOf(message.kind) < 0) || <MessageComponent {...message} key={i} />
        ))}
      </div>
    );
  }
}
