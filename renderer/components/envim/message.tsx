import React from "react";
import { ipcRenderer, IpcRendererEvent } from "electron";

import { notificate } from "../../utils/icons";
import { Highlights } from "../../utils/highlight";
import { font } from "../../utils/font";

interface Props {
}

interface States {
  messages: { group: number, kind: string, content: string[][] }[];
}

const position: "absolute" = "absolute";
const pointerEvents: "none" = "none";
const whiteSpace: "pre-wrap" = "pre-wrap";
const styles = {
  scope: {
    position,
    top: 10,
    right: 10,
    pointerEvents,
  },
  content: {
    animation: "fadeIn .5s ease",
    display: "flex",
    marginBottom: 16,
    border: "2px solid",
    borderRadius: 4,
    boxShadow: "5px 5px 10px 0px #000",
  },
  kind: {
    padding: "4px 8px",
  },
  message: {
    padding: 4,
    maxWidth: 300,
    overflow: "hidden",
    whiteSpace,
  },
  line: {
    margin: 0,
  },
};

export class MessageComponent extends React.Component<Props, States> {

  constructor(props: Props) {
    super(props);

    this.state = { messages: [] };
    ipcRenderer.on("messages:show", this.onMessage.bind(this));
    ipcRenderer.on("messages:clear", this.offMessage.bind(this));
  }

  componentWillUnmount() {
    ipcRenderer.removeAllListeners("messages:show");
    ipcRenderer.removeAllListeners("messages:clear");
  }

  private onMessage(_: IpcRendererEvent, group: number, kind: string, content: string[][], replace: boolean) {
    let messages: States["messages"] = [];
    if (replace) {
      messages = [
        ...this.state.messages.filter(message => message.group !== group),
        ...this.state.messages.filter(message => message.group === group).splice(0, -1),
        { group, kind, content }
      ];
    } else {
      messages = [...this.state.messages, { group, kind, content }];
    }
    this.setState({ messages });
  }

  private offMessage(_: IpcRendererEvent, group: number) {
    this.setState({ messages: this.state.messages.filter(message => message.group !== group) });
  }

  private getContentStyle(hl: number) {
    return {
      ...styles.content,
      borderColor: Highlights.color(hl, "foreground"),
    };
  }

  private getKind(kind: string, hl: number) {
    const { size } = font.get();
    const style = {
      ...styles.kind,
      color: Highlights.color(hl, "background"),
      background: Highlights.color(hl, "foreground"),
      fontSize: size,
    };

    return <i style={style}>{ notificate(kind) }</i>
  }

  private getMessageStyle(hl: number) {
    return {
      ...styles.message,
      color: Highlights.color(hl, "foreground"),
      background: Highlights.color(hl, "background"),
    };
  }

  render() {
    const { size } = font.get();
    return this.state.messages.length === 0 ? null : (
      <div style={{...styles.scope, fontSize: size}}>
        {this.state.messages.map(({ kind, content }, i) => (
          content.map(([hl, message], j) => (
            <div style={this.getContentStyle(+hl)} key={`${i}.${j}`}>
              {this.getKind(kind, +hl)}
              <div style={this.getMessageStyle(+hl)}>{ message.replace(/^\n/, "") }</div>
            </div>
          ))
        ))}
      </div>
    );
  }
}
