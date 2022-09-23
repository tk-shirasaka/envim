import React, { createRef, RefObject } from "react";

import { IMessage } from "../../../common/interface";

import { Emit } from "../../utils/emit";
import { Setting } from "../../utils/setting";

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
  debug: string;
}

const styles = {
  scope: {
    zIndex: 20,
    bottom: 0,
  },
  history: {
    maxHeight: 200,
    width: "100%",
    bottom: 0,
  },
};

export class HistoryComponent extends React.Component<Props, States> {
  private bottom: RefObject<HTMLDivElement> = createRef<HTMLDivElement>();
  private timer: number = 0;

  constructor(props: Props) {
    super(props);

    this.state = { messages: [], debug: "" };
    Emit.on("messages:mode", this.onMode);
    Emit.on("messages:command", this.onCommand);
    Emit.on("messages:ruler", this.onRuler);
    Emit.on("messages:history", this.onHistory);
  }

  componentWillUnmount = () => {
    clearInterval(this.timer);
    Emit.off("messages:mode", this.onMode);
    Emit.off("messages:command", this.onCommand);
    Emit.off("messages:ruler", this.onRuler);
    Emit.off("messages:history", this.onHistory);
    Emit.off("debug", this.onDebug);
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

  private onDebug = (direction: "send" | "receive", event: string, ...args: any[]) => {
    if (`${direction} ${event}`.search(this.state.debug) < 0) return;

    this.onHistory([{ contents: [
      direction === "send" ? { hl: "yellow", content: `[ 祝${event} ]\n` } : { hl: "blue", content: `[  ${event} ]\n` },
      { hl: "0", content: JSON.stringify(args, null, 2) }], kind: "debug" }
    ]);
  }

  private onClear = () => {
    this.setState({ messages: [] });
  }

  private onMouseEnter = () => {
    if (Setting.options.ext_messages && this.state.debug === "") {
      Emit.send("envim:command", "messages");
      clearInterval(this.timer);
      this.timer = +setInterval(() => Emit.send("envim:command", "messages"), 500);
    }
  }

  private onMouseLeave = () => {
    clearInterval(this.timer);
  }

  private openBrowser = async () => {
    const args = ["input", ["URL: "]]
    const url = await Emit.send<string>("envim:api", "nvim_call_function", args);

    Emit.send("browser:url", url);
  }

  private toggleDebug = async () => {
    const args = ["input", ["Event name: "]]
    const debug = await Emit.send<string>("envim:api", "nvim_call_function", args);

    try {
      "".search(debug);

      this.onMouseLeave();
      this.state.debug === "" && debug && Emit.on("debug", this.onDebug);
      debug === "" && Emit.off("debug", this.onDebug);
      setTimeout(() => this.onMouseEnter());

      this.setState({ debug });
    } catch (e: any) {
      if (e instanceof Error) {
        const contents = [{ hl: "red", content: e.message }];
        Emit.share("messages:show", [{ kind: "debug", contents }], true);
      }
    }
  }

  render() {
    return (
      <FlexComponent animate="hover" direction="column-reverse" position="absolute" overflow="visible" style={styles.scope} onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave}>
        <FlexComponent color="default" style={this.props}>
          { this.state.mode && <FlexComponent animate="fade-in" margin={["auto", 4]} rounded={[4]} shadow><MessageComponent message={this.state.mode} open noaction /></FlexComponent> }
          { this.state.command && <FlexComponent animate="fade-in" margin={["auto", 4]} rounded={[4]} shadow><MessageComponent message={this.state.command} open noaction /></FlexComponent> }
          { this.state.ruler && <FlexComponent animate="fade-in" margin={["auto", 4]} rounded={[4]} shadow><MessageComponent message={this.state.ruler} open noaction /></FlexComponent> }
          <div className="space" />
          <IconComponent color="blue-fg" font="爵" onClick={this.openBrowser} />
          <IconComponent color="green-fg" active={this.state.debug.length > 0} font="" onClick={this.toggleDebug} />
          <IconComponent color="red-fg" font="" onClick={this.onClear} />
        </FlexComponent>
        <FlexComponent overflow="visible" hover>
          <FlexComponent direction="column" position="absolute" rounded={[4, 4, 0, 0]} overflow="auto" style={styles.history} shadow>
            {this.state.messages.map((message, i) => <div key={i}><MessageComponent message={message} open={message.kind !== "debug"} /></div>)}
            <div ref={this.bottom} />
          </FlexComponent>
        </FlexComponent>
      </FlexComponent>
    );
  }
}
