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

    this.state = { messages: [], enter: false, debug: "" };
    Emit.on("messages:mode", this.onMode);
    Emit.on("messages:command", this.onCommand);
    Emit.on("messages:ruler", this.onRuler);
    Emit.on("messages:history", this.onHistory);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
    Emit.clear(["messages:mode", "messages:command", "messages:ruler", "messages:history", "debug"]);
  }

  private onMode = (message: IMessage) => {
    this.setState({ mode: message.contents.length ? message : undefined });
  }

  private onCommand = (message: IMessage) => {
    this.setState({ command: message.contents.length ? message : undefined });
  }

  private onRuler = (message: IMessage) => {
    this.setState({ ruler: message.contents.length ? message : undefined });
  }

  private onHistory = (messages: IMessage[]) => {
    messages = [ ...this.state.messages, ...messages ];
    this.setState({ messages: messages.slice(-1000) });
    setTimeout(() => this.bottom.current?.scrollIntoView({ behavior: "smooth" }));
  }

  private onDebug = (event: string, ...args: any[]) => {
    if (event.search(this.state.debug) < 0) return;

    this.onHistory([{ contents: [{ hl: "0", content: `-- ${event} --\n${JSON.stringify(args, null, 2)}` }], kind: "debug" }]);
  }

  private onClear = () => {
    this.setState({ messages: [] });
  }

  private onMouseEnter = () => {
    Emit.send("envim:command", "messages");
    this.timer = +setInterval(() => Emit.send("envim:command", "messages"), 500);
    this.setState({ enter: true})
  }

  private onMouseLeave = () => {
    const timer = this.timer;
    this.timer = 0;

    setTimeout(() => {
      if (this.timer) return;

      clearInterval(timer);
      this.setState({ enter: false})
    }, 500);
  }

  private toggleDebug = async () => {
    const args = ["input", ["Event name: "]]
    const debug = await Emit.send<string>("envim:api", "nvim_call_function", args);

    try {
      "".search(debug);

      this.state.debug === "" && debug && Emit.on("debug", this.onDebug);
      debug === "" && Emit.clear(["debug"]);

      this.setState({ debug });
    } catch (e: any) {
      if (e instanceof Error) {
        const contents = [{ hl: "red", content: e.message }];
        Emit.share("messages:show", { kind: "debug", contents }, true);
      }
    }
  }

  private getScopeStyle() {
    return { ...styles.scope, ...this.props, ...( this.state.enter ? styles.open : {} ) };
  }

  render() {
    return (
      <FlexComponent className="animate" direction="column-reverse" position="absolute" style={this.getScopeStyle()} onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave} shadow>
        <FlexComponent color="black" style={this.props}>
          { this.state.mode && <FlexComponent className="animate fade-in" margin={["auto", 4]} rounded={[4]} shadow><MessageComponent message={this.state.mode} open noaction /></FlexComponent> }
          { this.state.command && <FlexComponent className="animate fade-in" margin={["auto", 4]} rounded={[4]} shadow><MessageComponent message={this.state.command} open noaction /></FlexComponent> }
          { this.state.ruler && <FlexComponent className="animate fade-in" margin={["auto", 4]} rounded={[4]} shadow><MessageComponent message={this.state.ruler} open noaction /></FlexComponent> }
          <div className="space" />
          <IconComponent color={ this.state.debug ? "green-fg" : "gray-fg" } font="" onClick={this.toggleDebug} />
          <IconComponent color="red-fg" font="" onClick={this.onClear} />
        </FlexComponent>
        <FlexComponent direction="column" grow={1} shrink={1} rounded={[4, 4, 0, 0]} overflow="auto">
          {this.state.messages.map((message, i) => <div key={i}><MessageComponent message={message} open={message.kind !== "debug"} /></div>)}
          <div className="space" style={Highlights.style("0")} ref={this.bottom} />
        </FlexComponent>
      </FlexComponent>
    );
  }
}
