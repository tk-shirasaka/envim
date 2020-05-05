import React from "react";

import { IMessage } from "../../../common/interface";

import { Emit } from "../../utils/emit";
import { Localstorage } from "../../utils/localstorage";

import { MessageComponent } from "./message";

interface Props {
}

interface States {
  messages: IMessage[];
  selected: IMessage | null;
  setting: { others: { notify: boolean; } };
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
    boxShadow: "2px 2px 6px -2px",
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
    boxShadow: "2px 2px 6px -2px",
    overflow: "hidden",
  },
  icon: {
    position,
    right: 0,
    padding: 4,
  },
};

export class NotificateComponent extends React.Component<Props, States> {
  private ls: Localstorage<States["setting"]> = new Localstorage<States["setting"]>("setting", { others: { notify: true } });

  constructor(props: Props) {
    super(props);

    this.state = { messages: [], selected: null, setting: this.ls.get() };
    Emit.on("messages:notificate", this.onMessage.bind(this));
    Emit.on("setting:notify", this.toggleNotify.bind(this));
  }

  componentWillUnmount() {
    Emit.clear(["messages:notificate", "setting:notify"]);
  }

  private onMessage(messages: IMessage[]) {
    this.setState({ messages });
  }

  private toggleNotify(setting: States["setting"]) {
    this.setState({ setting });
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
    if (!this.state.setting.others.notify) return null;
    return this.state.selected ? this.renderSelected() : this.renderMessages();
  }
}
