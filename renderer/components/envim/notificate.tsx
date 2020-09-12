import React, { MouseEvent } from "react";

import { IMessage } from "../../../common/interface";

import { Emit } from "../../utils/emit";
import { Setting } from "../../utils/setting";

import { MessageComponent } from "./message";

interface Props {
}

interface States {
  messages: IMessage[];
  setting: { [k: string]: boolean; };
}

const position: "absolute" = "absolute";
const styles = {
  notificate: {
    position,
    zIndex: 10,
    right: 0,
    width: 300,
    maxHeight: "100%",
    borderRadius: "0 0 0 4px",
    boxShadow: "8px 8px 4px 0 rgba(0, 0, 0, 0.6)",
    overflow: "auto",
    cursor: "pointer",
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

    this.state = { messages: [], setting: Setting.others };
    Emit.on("messages:notificate", this.onMessage.bind(this));
    Emit.on("setting:others", this.onNotify.bind(this));
  }

  componentWillUnmount() {
    Emit.clear(["messages:notificate", "setting:others"]);
  }

  private onMessage(messages: IMessage[]) {
    this.setState({ messages });
  }

  private onNotify() {
    this.setState({ setting: Setting.others });
  }

  private offNotify(e: MouseEvent) {
    const setting = { ...this.state.setting, notify: false };

    e.stopPropagation();
    e.preventDefault();

    Setting.others = setting;
    Emit.share("envim:focus");
    this.setState({ setting });
  }

  render() {
    if (!this.state.setting.notify) return null;
    return this.state.setting.notify && this.state.messages.length > 0 && (
      <div className="animate slide-right" style={styles.notificate} onClick={this.offNotify.bind(this)}>
        {this.state.messages.map((message, i) => <MessageComponent {...message} key={i} />)}
      </div>
    );
  }
}
