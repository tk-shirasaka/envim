import React, { MouseEvent } from "react";

import { Emit } from "../../utils/emit";

import { IconComponent } from "../icon";
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
    display: "flex",
    width: 300,
    maxHeight: 100,
    marginBottom: 8,
    borderRadius: 4,
    boxShadow: "5px 5px 10px 0px #000",
    overflow: "auto",
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
  icon: {
    padding: "0 4px",
  },
};

export class NotificateComponent extends React.Component<Props, States> {

  constructor(props: Props) {
    super(props);

    this.state = { messages: [], selected: null };
    Emit.on("messages:show", this.onMessage.bind(this));
    Emit.on("messages:clear", this.offMessage.bind(this));
  }

  componentWillUnmount() {
    Emit.clear(["messages:show", "messages:clear"]);
  }

  private onMessage(group: number, kind: string, content: string[][], replace: boolean) {
    let messages: States["messages"] = [];

    if (content.filter(([_, message]) => message.replace("\n", "")).length === 0) return;
    if (replace) {
      messages = [
        ...this.state.messages.filter(message => message.group !== group),
        ...this.state.messages.filter(message => message.group === group).splice(0, -1),
        { group, kind, content }
      ];
    } else {
      const i = this.state.messages.length - 1;
      messages = [...this.state.messages];
      if (i < 0 || messages[i].group !== group || messages[i].kind !== kind) {
        messages.push({ group, kind, content });
      } else if (JSON.stringify(messages[i].content) !== JSON.stringify(content)) {
        messages[i].content = [...messages[i].content, ["0", "\n"], ...content];
      }
    }
    this.setState({ messages });
  }

  private offMessage(group: number) {
    this.setState({ messages: this.state.messages.filter(message => message.group !== group) });
  }

  private onSelect(kind: string, content: string[][]) {
    this.setState({ selected: { kind, content } })
  }

  private offSelect() {
    Emit.share("envim:focus");
    this.setState({ selected: null })
  }

  private onClose(e: MouseEvent, i: number) {
    e.stopPropagation();
    e.preventDefault();
    Emit.share("envim:focus");
    this.state.messages.splice(i, 1);
    this.setState({ messages: this.state.messages, selected: null });
  }

  private renderMessages() {
    return this.state.messages.length === 0 ? null : (
      <div style={styles.notificate}>
        {this.state.messages.map(({ kind, content }, i) => (
          <div style={styles.message} onClick={() => this.onSelect(kind, content)} key={i}>
            <MessageComponent kind={kind} content={content} />
            <IconComponent color="red" style={styles.icon} font="" onClick={e => this.onClose(e, i)} />
          </div>
        ))}
      </div>
    );
  }

  private renderSelected() {
    return this.state.selected && (
      <div style={styles.selected} onClick={() => this.offSelect()}>
        <MessageComponent {...this.state.selected} />
      </div>
    );
  }

  render() {
    return this.state.selected ? this.renderSelected() : this.renderMessages();
  }
}
