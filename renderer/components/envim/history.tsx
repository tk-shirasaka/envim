import React, { createRef, RefObject } from "react";

import { ISetting, IMessage } from "../../../common/interface";

import { Emit } from "../../utils/emit";
import { Setting } from "../../utils/setting";
import { Cache } from "../../utils/cache";

import { FlexComponent } from "../flex";
import { MenuComponent } from "../menu";
import { IconComponent } from "../icon";
import { MessageComponent } from "./message";

interface Props {
  width: number;
  height: number;
}

interface States {
  messages: IMessage[];
  theme: "dark" | "light";
  mode?: IMessage;
  command?: IMessage;
  ruler?: IMessage;
  options: ISetting["options"];
  debug: string;
}

const styles = {
  scope: {
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

    this.state = { messages: [], theme: Cache.get<"dark" | "light">("common", "theme"), options: Setting.options, debug: "" };
    Emit.on("messages:mode", this.onMode);
    Emit.on("messages:command", this.onCommand);
    Emit.on("messages:ruler", this.onRuler);
    Emit.on("messages:history", this.onHistory);
    Emit.on("option:set", this.onOption);
  }

  componentWillUnmount = () => {
    Emit.off("messages:mode", this.onMode);
    Emit.off("messages:command", this.onCommand);
    Emit.off("messages:ruler", this.onRuler);
    Emit.off("messages:history", this.onHistory);
    Emit.off("option:set", this.onOption);
    Emit.off("debug", this.onDebug);
  }

  private onMode = (message: IMessage) => {
    this.setState(() => ({ mode: message.contents.length ? message : undefined }));
  }

  private onCommand = (message: IMessage) => {
    this.setState(() => ({ command: message.contents.length ? message : undefined }));
  }

  private onRuler = (message: IMessage) => {
    this.setState(() => ({ ruler: message.contents.length ? message : undefined }));
  }

  private onHistory = (messages: IMessage[]) => {
    this.setState(state => {
      setTimeout(() => this.bottom.current?.scrollIntoView({ behavior: "smooth" }));
      messages = [ ...state.messages, ...messages ];

      return { messages: messages.slice(-1000) };
    })
  }

  private onOption = (options: { [k: string]: boolean }) => {
    this.setState(state => ({ options: { ...state.options, ...options } }));
  }

  private onDebug = (direction: "send" | "receive", event: string, ...args: any[]) => {
    if (`${direction} ${event}`.search(this.state.debug) < 0) return;

    this.onHistory([{ contents: [
      direction === "send" ? { hl: "yellow", content: `[ 󰕒${event} ]\n` } : { hl: "blue", content: `[ 󰇚 ${event} ]\n` },
      { hl: "0", content: JSON.stringify(args, null, 2) }], kind: "debug" }
    ]);
  }

  private onClear = () => {
    this.setState(() => ({ messages: [] }));
  }

  private loadMessages = () => {
    clearInterval(this.timer);
    this.timer = +setInterval(() => Emit.send("envim:command", "messages"), 500);
  }

  private unloadMessages = () => {
    clearInterval(this.timer);
  }

  private toggleTheme = () => {
    this.setState(state => {
      const theme = state.theme === "dark" ? "light" : "dark";

      Emit.send("envim:command", `set background=${theme}`);

      return { theme };
    });
  }

  private toggleDebug = async () => {
    const debug = await Emit.send<string>("envim:readline", "Event name");

    try {
      "".search(debug);

      this.state.debug === "" && debug && Emit.on("debug", this.onDebug);
      debug === "" && Emit.off("debug", this.onDebug);

      this.setState(() => ({ debug }));
    } catch (e: any) {
      if (e instanceof Error) {
        const contents = [{ hl: "red", content: e.message }];
        Emit.share("messages:show", [{ kind: "debug", contents }], true);
      }
    }
  }

  render() {
    return (
      <FlexComponent animate="hover" direction="column-reverse" position="absolute" overflow="visible" style={styles.scope}>
        <FlexComponent color="default" overflow="visible" style={this.props}>
          { this.state.mode && <FlexComponent animate="fade-in" margin={["auto", 4]} rounded={[4]} shadow><MessageComponent message={this.state.mode} open /></FlexComponent> }
          { this.state.command && <FlexComponent animate="fade-in" margin={["auto", 4]} rounded={[4]} shadow><MessageComponent message={this.state.command} open /></FlexComponent> }
          { this.state.ruler && <FlexComponent animate="fade-in" margin={["auto", 4]} rounded={[4]} shadow><MessageComponent message={this.state.ruler} open /></FlexComponent> }
          <div className="space" />
          <MenuComponent color="gray-fg" label="">
            { ["ext_tabline", "ext_cmdline", "ext_messages", "ext_popupmenu", "ext_termcolors"].map(ext => (
              <FlexComponent key={ext} onClick={() => Emit.send("envim:option", ext, !this.state.options[ext])} spacing>
                <input type="checkbox" value="command" checked={this.state.options[ext]} />{ ext }
              </FlexComponent>
            )) }
            <FlexComponent animate="hover" color="default" horizontal="center" onClick={this.toggleTheme}>
              <IconComponent color="orange-fg" active={this.state.theme === "light"} font="" />
              /
              <IconComponent color="yellow-fg" active={this.state.theme === "dark"} font="" />
            </FlexComponent>
          </MenuComponent>
          <IconComponent color="green-fg" active={this.state.debug.length > 0} font="" onClick={this.toggleDebug} />
        </FlexComponent>
        <FlexComponent overflow="visible" hover>
          <FlexComponent direction="column" position="absolute" rounded={[4, 4, 0, 0]} overflow="auto" style={styles.history} shadow>
            { this.state.messages.map((message, i) => <div key={i}><MessageComponent message={message} open={message.kind !== "debug"} /></div>) }
            { this.state.options.ext_messages && (
              <FlexComponent color="default" onMouseEnter={this.loadMessages} onMouseLeave={this.unloadMessages}>
                <FlexComponent grow={1} />
                <IconComponent color="lightblue-fg" font="󰑓" text="Load more..." />
                <FlexComponent grow={1} />
                { this.state.messages.length === 0 ? null : <IconComponent color="red-fg" font="󰂭" onClick={this.onClear} /> }
              </FlexComponent>
            ) }
            <div ref={this.bottom} />
          </FlexComponent>
        </FlexComponent>
      </FlexComponent>
    );
  }
}
