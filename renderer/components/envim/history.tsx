import React, { createRef, RefObject } from "react";

import { IMessage } from "../../../common/interface";

import { Emit } from "../../utils/emit";
import { Highlights } from "../../utils/highlight";

import { FlexComponent } from "../flex";
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
  debug: string;
}

const styles = {
  scope: {
    zIndex: 10,
    bottom: 0,
  },
  open: {
    height: "30%",
  },
};

export class HistoryComponent extends React.Component<Props, States> {
  private bottom: RefObject<HTMLDivElement> = createRef<HTMLDivElement>();
  private timer: number = 0;

  constructor(props: Props) {
    super(props);

    this.state = { messages: [], enter: false, select: -1, debug: "" };
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
    if (!this.state.debug || event.search(this.state.debug) < 0) return;

    this.onHistory([{ contents: [{ hl: "0", content: `-- ${event} --\n${JSON.stringify(args, null, 2)}` }], kind: "debug" }]);
  }

  private onClear() {
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

  private async toggleDebug() {
    const args = ["input", ["Event name: "]]
    const debug = await Emit.send<string>("envim:api", "nvim_call_function", args);

    try {
      "".search(debug);
      this.setState({ debug });
    } catch (e: any) {
      if (e instanceof Error) {
        const contents = [{ hl: "red", content: e.message }];
        Emit.share("messages:show", { kind: "debug", contents }, true);
      }
    }
  }

  private toggleSelect(select: number) {
    if (this.state.messages[select].kind === "debug") {
      this.setState({ select: this.state.select === select ? -1 : select });
    }
  }

  private getScopeStyle() {
    return { ...styles.scope, ...this.props, ...( this.state.enter ? styles.open : {} ) };
  }

  render() {
    return (
      <FlexComponent className="animate" direction="column-reverse" position="absolute" style={this.getScopeStyle()} onMouseEnter={this.onMouseEnter.bind(this)} onMouseLeave={this.onMouseLeave.bind(this)} shadow>
        <FlexComponent color="black" style={this.props}>
          { this.state.mode && <FlexComponent className="animate fade-in" margin={["auto", 4]} rounded={[4]} shadow><MessageComponent message={this.state.mode} open /></FlexComponent> }
          { this.state.command && <FlexComponent className="animate fade-in" margin={["auto", 4]} rounded={[4]} shadow><MessageComponent message={this.state.command} open /></FlexComponent> }
          { this.state.ruler && <FlexComponent className="animate fade-in" margin={["auto", 4]} rounded={[4]} shadow><MessageComponent message={this.state.ruler} open /></FlexComponent> }
          <div className="space" />
          <IconComponent color={ this.state.debug ? "green-fg" : "gray-fg" } font="" onClick={this.toggleDebug.bind(this)} />
          <IconComponent color="red-fg" font="" onClick={this.onClear.bind(this)} />
        </FlexComponent>
        <FlexComponent direction="column" grow={1} shrink={1} rounded={[4, 4, 0, 0]} overflow="auto">
          {this.state.messages.map((message, i) => <div key={i}><MessageComponent message={message} open={message.kind !== "debug" || this.state.select === i} onClick={() => this.toggleSelect(i)} /></div>)}
          <div className="space" style={Highlights.style("0")} ref={this.bottom} />
        </FlexComponent>
      </FlexComponent>
    );
  }
}
