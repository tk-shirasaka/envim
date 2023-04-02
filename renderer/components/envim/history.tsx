import React, { createRef, RefObject } from "react";

import { IMessage } from "../../../common/interface";

import { Emit } from "../../utils/emit";
import { Setting } from "../../utils/setting";

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
  mode?: IMessage;
  command?: IMessage;
  ruler?: IMessage;
  options: { [k:string]: boolean; };
  debug: string;
  browser: { id: number; title: string; url: string; active: boolean; }[];
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
  browser: {
    width: 300,
    maxWidth: "80vh",
    textOverflow: "ellipsis"
  },
};

export class HistoryComponent extends React.Component<Props, States> {
  private bottom: RefObject<HTMLDivElement> = createRef<HTMLDivElement>();
  private timer: number = 0;

  constructor(props: Props) {
    super(props);

    this.state = { messages: [], options: Setting.options, debug: "", browser: [] };
    Emit.on("messages:mode", this.onMode);
    Emit.on("messages:command", this.onCommand);
    Emit.on("messages:ruler", this.onRuler);
    Emit.on("messages:history", this.onHistory);
    Emit.on("option:set", this.onOption);
    Emit.on("browser:update", this.browserUpdate);
  }

  componentWillUnmount = () => {
    clearInterval(this.timer);
    Emit.off("messages:mode", this.onMode);
    Emit.off("messages:command", this.onCommand);
    Emit.off("messages:ruler", this.onRuler);
    Emit.off("messages:history", this.onHistory);
    Emit.off("option:set", this.onOption);
    Emit.off("browser:update", this.browserUpdate);
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

  private onOption = (options: { [k: string]: boolean }) => {
    this.setState({ options: { ...this.state.options, ...options } });
  }

  private browserUpdate = (browser: { id: number, title: string, url: string, active: boolean }[]) => {
    this.setState({ browser });
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
    if (this.state.options.ext_messages && this.state.debug === "") {
      Emit.send("envim:command", "messages");
      clearInterval(this.timer);
      this.timer = +setInterval(() => Emit.send("envim:command", "messages"), 500);
    }
  }

  private onMouseLeave = () => {
    clearInterval(this.timer);
  }

  private openBrowser = (id: number) => {
    Emit.send("browser:open", id);
  }

  private closeBrowser = (e: MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();

    Emit.send("browser:close", id);
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

  private renderBrowser = (browser: { id: number; title: string; url: string; active: boolean; }) => {
    const icon = browser.url.search(/^https/) < 0 ? { color: "gray-fg", font: "" } : { color: "green-fg", font: "" };

    return (
      <FlexComponent key={browser.id} animate="hover" color="default" direction="column" active={browser.active} style={styles.browser} onClick={() => this.openBrowser(browser.id)}>
        { browser.title }
        <div className="small">{ <IconComponent { ...icon } text={browser.url.replace(/^https?:\/\/([^\/]+)\/.*$/, "$1")} /> }</div>
        <IconComponent color="gray" font="" float="right" onClick={(e) => this.closeBrowser(e, browser.id)} hover />
      </FlexComponent>
    );
  }

  render() {
    return (
      <FlexComponent animate="hover" direction="column-reverse" position="absolute" overflow="visible" style={styles.scope} onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave}>
        <FlexComponent color="default" overflow="visible" style={this.props}>
          { this.state.mode && <FlexComponent animate="fade-in" margin={["auto", 4]} rounded={[4]} shadow><MessageComponent message={this.state.mode} open /></FlexComponent> }
          { this.state.command && <FlexComponent animate="fade-in" margin={["auto", 4]} rounded={[4]} shadow><MessageComponent message={this.state.command} open /></FlexComponent> }
          { this.state.ruler && <FlexComponent animate="fade-in" margin={["auto", 4]} rounded={[4]} shadow><MessageComponent message={this.state.ruler} open /></FlexComponent> }
          <div className="space" />
          <MenuComponent color="gray-fg" style={{paddingRight: 4}} label="">
            { ["ext_tabline", "ext_cmdline", "ext_messages", "ext_popupmenu", "ext_termcolors"].map(ext => (
              <FlexComponent animate="hover" color="default" key={ext} onClick={() => Emit.send("envim:option", ext, !this.state.options[ext])}>
                <input type="checkbox" value="command" checked={this.state.options[ext]} />{ ext }
              </FlexComponent>
            )) }
          </MenuComponent>
          <MenuComponent color="blue-fg" style={{}} label="爵" onClick={() => this.openBrowser(-1)}>{ this.state.browser.map(this.renderBrowser) }</MenuComponent>
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
