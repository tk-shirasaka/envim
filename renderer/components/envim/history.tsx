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
  messages: IMessage[];
}

const position: "sticky" = "sticky";
const styles = {
  scope: {
    overflow: "auto",
  },
  actions: {
    position,
    display: "flex",
    top: 0,
  },
  icon: {
    padding: "2px 4px",
  },
};

export class HistoryComponent extends React.Component<Props, States> {
  private timer: number = 0;

  constructor(props: Props) {
    super(props);

    this.state = { messages: [] };
    Emit.on("messages:history", this.onHistory.bind(this));
  }

  componentWillUnmount() {
    clearInterval(this.timer);
    Emit.clear(["messages:history"]);
  }

  private onClose() {
    Emit.send("envim:command", "messages clear");
    Emit.share("messages:history", []);

    clearInterval(this.timer);
  }

  private onHistory(messages: IMessage[]) {
    if (this.state.messages.length === 0 && messages.length) {
      const timer = +setInterval(() => {
        this.state.messages.length
          ? Emit.send("envim:command", "messages")
          : clearInterval(timer);
      }, 500);
      this.timer = timer;
    }

    if (messages.length && this.state.messages.length !== messages.length) {
      setTimeout(() => (this.refs.bottom as HTMLDivElement).scrollIntoView({ behavior: "smooth" }), 500);
    }
    this.setState({ messages });
  }

  render() {
    return this.state.messages.length > 0 && (
      <div style={{...styles.scope, ...this.props, ...Highlights.style(0)}}>
        <div className="color-white" style={styles.actions}>
          <div className="space" />
          <IconComponent color="black-fg" style={styles.icon} font="" onClick={this.onClose.bind(this)} />
        </div>
        {this.state.messages.map((message, i) => <MessageComponent {...message} key={i} />)}
        <div ref="bottom" />
      </div>
    );
  }
}
