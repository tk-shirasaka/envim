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
  mode?: IMessage;
  command?: IMessage;
  ruler?: IMessage;
  enter: boolean;
  select: number;
  debug: boolean;
}

const positionA: "absolute" = "absolute";
const position: "sticky" = "sticky";
const flexDirection: "column" = "column";
const styles = {
  scope: {
    position: positionA,
    flexDirection,
    display: "flex",
    zIndex: 10,
    bottom: 0,
  },
  open: {
    height: "30%",
    overflow: "auto",
  },
  close: {
    overflow: "hidden",
  },
  message: {
    marginRight: 8,
    overflow: "hidden",
    borderRadius: "4px 4px 0 0",
    boxShadow: "0 0 4px 0 rgba(0, 0, 0, 0.6)",
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

    this.state = { messages: [], enter: false, select: -1, debug: false };
    Emit.on("messages:mode", this.onMode.bind(this));
    Emit.on("messages:command", this.onCommand.bind(this));
    Emit.on("messages:ruler", this.onRuler.bind(this));
    Emit.on("messages:history", this.onHistory.bind(this));
    Emit.on("debug", this.onDebug.bind(this));
  }

  componentWillUnmount() {
    clearInterval(this.timer);
    Emit.clear(["messages:mode", "messages:command", "messages:ruler", "messages:history", "debug"]);
  }

  private onMode(message: IMessage) {
    this.setState({ mode: message.contents.length ? message : undefined });
  }

  private onCommand(message: IMessage) {
    this.setState({ command: message.contents.length ? message : undefined });
  }

  private onRuler(message: IMessage) {
    this.setState({ ruler: message.contents.length ? message : undefined });
  }

  private onHistory(messages: IMessage[]) {
    messages = [ ...this.state.messages, ...messages ];
    this.setState({ messages: messages.slice(-1000) });
    setTimeout(() => this.bottom.current?.scrollIntoView({ behavior: "smooth" }));
  }

  private onDebug(event: string, ...args: any[]) {
    if (!this.state.debug) return;

    this.onHistory([{ contents: [{ hl: 0, content: `-- ${event} --\n${JSON.stringify(args, null, 2)}` }], kind: "debug" }]);
  }

  private onClear() {
    Emit.share("envim:focus");
    this.setState({ messages: [], select: -1 });
  }

  private onMouseEnter() {
    Emit.send("envim:command", "messages");
    this.timer = +setInterval(() => Emit.send("envim:command", "messages"), 500);
    this.setState({ enter: true})
  }

  private onMouseLeave() {
    const timer = this.timer;
    this.timer = 0;

    setTimeout(() => {
      if (this.timer) return;

      clearInterval(timer);
      this.setState({ enter: false})
    }, 500);
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
    if (this.state.messages[select].kind === "debug") {
    this.setState({ select: this.state.select === select ? -1 : select });
    }
  }

  private getScopeStyle() {
    return this.state.enter
      ? { ...styles.scope, ...this.props, ...styles.open }
      : { ...styles.scope, ...this.props, ...styles.close }
  }

  render() {
    return (
      <div className="animate" style={this.getScopeStyle()} onMouseEnter={this.onMouseEnter.bind(this)} onMouseLeave={this.onMouseLeave.bind(this)}>
        <div className="color-white" style={styles.actions}>
          { this.state.mode && <div className="animate fade-in" style={styles.message}><MessageComponent message={this.state.mode} open={true} /></div> }
          { this.state.command && <div className="animate fade-in" style={styles.message}><MessageComponent message={this.state.command} open={true} /></div> }
          { this.state.ruler && <div className="animate fade-in" style={styles.message}><MessageComponent message={this.state.ruler} open={true} /></div> }
          <div className="space" />
          <IconComponent color={ this.state.debug ? "green-fg" : "gray-fg" } style={styles.icon} font="" onClick={this.toggleDebug.bind(this)} />
          <IconComponent color="red-fg" style={styles.icon} font="" onClick={this.onClear.bind(this)} />
        </div>
        {this.state.messages.map((message, i) => <MessageComponent key={i} message={message} open={message.kind !== "debug" || this.state.select === i} onClick={e => this.toggleSelect(e, i)} />)}
        <div className="space" style={Highlights.style(0)} ref={this.bottom} />
      </div>
    );
  }
}
