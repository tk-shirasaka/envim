import React from "react";

import { IMessage } from "../../../common/interface";

import { Emit } from "../../utils/emit";
import { Setting } from "../../utils/setting";

import { MessageComponent } from "./message";

interface Props {
}

interface States {
  messages: IMessage[];
  selected: IMessage | null;
  setting: { [k: string]: boolean; };
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
    boxShadow: "8px 8px 4px 0 rgba(0, 0, 0, 0.6)",
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
    boxShadow: "8px 8px 4px 0 rgba(0, 0, 0, 0.6)",
    overflow: "hidden",
  },
  icon: {
    position,
    right: 0,
    padding: 4,
  },
};

export class NotificateComponent extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);

    this.state = { messages: [], selected: null, setting: Setting.others };
    Emit.on("messages:notificate", this.onMessage.bind(this));
    Emit.on("setting:others", this.toggleNotify.bind(this));
  }

  componentWillUnmount() {
    Emit.clear(["messages:notificate", "setting:others"]);
  }

  private onMessage(messages: IMessage[]) {
    this.setState({ messages });
  }

  private toggleNotify() {
    this.setState({ setting: Setting.others, selected: null });
  }

  private onSelect(selected: IMessage) {
    this.setState({ selected })
  }

  private offSelect() {
    Emit.share("envim:focus");
    this.setState({ selected: null })
  }

  private renderMessages() {
    return this.state.messages.length === 0 ? null : (
      <div style={styles.notificate}>
        {this.state.messages.map((message, i) => (
          <div style={styles.message} onClick={() => this.onSelect(message)} key={i}>
            <MessageComponent {...message} />
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
    if (!this.state.setting.notify) return null;
    return this.state.selected ? this.renderSelected() : this.renderMessages();
  }
}
