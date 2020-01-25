import React from "react";
import { ipcRenderer, IpcRendererEvent } from "electron";

import { notificate } from "../../utils/icons";
import { Highlights } from "../../utils/highlight";

interface Props {
  font: { size: number; width: number; height: number; };
}

interface States {
  messages: { kind: string, content: string[][] }[];
}

const position: "absolute" = "absolute";
const whiteSpace: "nowrap" = "nowrap";
const styles = {
  scope: {
    position,
    top: 10,
    right: 10,
  },
  content: {
    opacity: 0.8,
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
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace,
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

  private onMessage(_: IpcRendererEvent, kind: string, content: string[][], replace: boolean) {
    const messages = [...this.state.messages];
    if (replace) {
      messages.splice(-1, 1, { kind, content });
    } else {
      messages.push({ kind, content });
    }
    this.setState({ messages });
  }

  private offMessage() {
    this.setState({ messages: [] });
  }

  private getContentStyle(hl: number) {
    return {
      ...styles.content,
      borderColor: Highlights.color(hl, "foreground"),
    };
  }

  private getKind(kind: string, hl: number) {
    const style = {
      ...styles.kind,
      color: Highlights.color(hl, "background"),
      background: Highlights.color(hl, "foreground"),
      fontSize: this.props.font.size,
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
    return this.state.messages.length && (
      <div style={{...styles.scope, fontSize: this.props.font.size}}>
        {this.state.messages.map(({ kind, content }, i) => (
          content.map(([hl, message], j) => (
            <div style={this.getContentStyle(+hl)} key={`${i}.${j}`}>
              {this.getKind(kind, +hl)}
              <div style={this.getMessageStyle(+hl)}>{ message }</div>
            </div>
          ))
        ))}
      </div>
    );
  }
}
