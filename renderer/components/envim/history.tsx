import React, { createRef, RefObject, MouseEvent } from "react";

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
  select: number;
  debug: boolean;
}

const position: "sticky" = "sticky";
const flexDirection: "column" = "column";
const styles = {
  scope: {
    overflow: "auto",
    display: "flex",
    flexDirection,
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
  private bottom: RefObject<HTMLDivElement> = createRef<HTMLDivElement>();
  private timer: number = 0;

  constructor(props: Props) {
    super(props);

    this.state = { messages: [], select: -1, debug: false };
    this.timer = +setInterval(() => Emit.send("envim:command", "messages"), 500);
    Emit.on("messages:history", this.onHistory.bind(this));
    Emit.on("debug", this.onDebug.bind(this));
  }

  componentWillUnmount() {
    clearInterval(this.timer);
    Emit.clear(["messages:history", "debug"]);
  }

  private onHistory(messages: IMessage[]) {
    messages = [ ...this.state.messages, ...messages ];
    this.setState({ messages: messages.slice(-1000) });
    setTimeout(() => this.bottom.current?.scrollIntoView({ behavior: "smooth" }));
  }

  private onDebug(event: string, ...args: any[]) {
    if (!this.state.debug) return;

    this.onHistory([{ contents: [{ hl: 0, content: `-- ${event} --\n${JSON.stringify(args, null, 2)}` }], kind: "debug", timestamp: 0 }]);
  }

  private onClear() {
    Emit.share("envim:focus");
    this.setState({ messages: [], select: -1 });
  }

  private toggleDebug(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();

    Emit.share("envim:focus");
    this.setState({ debug: !this.state.debug });
  }

  private toggleSelect(e: MouseEvent, select: number) {
    e.stopPropagation();
    e.preventDefault();

    Emit.share("envim:focus");
    this.setState({ select: this.state.select === select ? -1 : select });
  }

  render() {
    return (
      <div style={{...styles.scope, ...this.props}}>
        <div className="color-white" style={styles.actions}>
          <div className="space" />
          <IconComponent color={ this.state.debug ? "green-fg" : "gray-fg" } style={styles.icon} font="" onClick={this.toggleDebug.bind(this)} />
          <IconComponent color="red-fg" style={styles.icon} font="" onClick={this.onClear.bind(this)} />
        </div>
        {this.state.messages.map((message, i) => <MessageComponent key={i} message={message} open={this.state.select === i} onClick={e => this.toggleSelect(e, i)} />)}
        <div className="space" style={Highlights.style(0)} ref={this.bottom} />
      </div>
    );
  }
}
