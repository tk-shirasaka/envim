import React from "react";
import { ipcRenderer, IpcRendererEvent } from "electron";

import { Emit } from "../../utils/emit";
import { font } from "../../utils/font";

import { MessageComponent } from "./message";

interface Props {
}

interface States {
  messages: { group: number, kind: string, content: string[][] }[];
  selected: { kind: string, content: string[][] } | null;
}

const position: "absolute" = "absolute";
const styles = {
  notificate: {
    position,
    top: 10,
    right: 10,
  },
  message: {
    cursor: "pointer",
    animation: "fadeIn .5s ease",
    maxHeight: 100,
    maxWidth: 300,
    marginBottom: 8,
    borderRadius: 4,
    boxShadow: "5px 5px 10px 0px #000",
    overflow: "hidden",
  },
  selected: {
    position,
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    cursor: "pointer",
    animation: "fadeIn .5s ease",
    borderRadius: 4,
    boxShadow: "5px 5px 10px 0px #000",
    overflow: "hidden",
  },
};

export class NotificateComponent extends React.Component<Props, States> {

  constructor(props: Props) {
    super(props);

    this.state = { messages: [], selected: null };
    ipcRenderer.on("messages:show", this.onMessage.bind(this));
    ipcRenderer.on("messages:clear", this.offMessage.bind(this));
  }

  componentWillUnmount() {
    ipcRenderer.removeAllListeners("messages:show");
    ipcRenderer.removeAllListeners("messages:clear");
  }

  private onMessage(_: IpcRendererEvent, group: number, kind: string, content: string[][], replace: boolean) {
    let messages: States["messages"] = [];

    if (content.filter(([_, message]) => message.replace("\n", "")).length === 0) return;
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

  private onSelect(kind: string, content: string[][]) {
    this.setState({ selected: { kind, content } })
  }

  private offSelect() {
    Emit.send("envim:focus");
    this.setState({ selected: null })
  }

  private renderMessages() {
    const { size } = font.get();
    return this.state.messages.length === 0 ? null : (
      <div style={{...styles.notificate, fontSize: size}}>
        {this.state.messages.map(({ kind, content }, i) => (
          <div style={styles.message} onClick={() => this.onSelect(kind, content)} key={i}>
            <MessageComponent kind={kind} content={content} scrollable={false} />
          </div>
        ))}
      </div>
    );
  }

  private renderSelected() {
    const { size } = font.get();
    return this.state.selected && (
      <div style={{...styles.selected, fontSize: size}} onClick={() => this.offSelect()}>
        <MessageComponent {...this.state.selected} scrollable={true} />
      </div>
    );
  }

  render() {
    return this.state.selected ? this.renderSelected() : this.renderMessages();
  }
}
