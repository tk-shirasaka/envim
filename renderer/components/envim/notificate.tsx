import React from "react";

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
    right: 0,
    width: 300,
    maxHeight: "100%",
    borderRadius: "0 0 0 4px",
    boxShadow: "8px 8px 4px 0 rgba(0, 0, 0, 0.6)",
    overflow: "auto",
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
    Emit.on("setting:others", this.toggleNotify.bind(this));
  }

  componentWillUnmount() {
    Emit.clear(["messages:notificate", "setting:others"]);
  }

  private onMessage(messages: IMessage[]) {
    this.setState({ messages });
  }

  private toggleNotify() {
    this.setState({ setting: Setting.others });
  }

  render() {
    if (!this.state.setting.notify) return null;
    return this.state.setting.notify && this.state.messages.length > 0 && (
      <div className="animate slide-right" style={styles.notificate}>
        {this.state.messages.map((message, i) => <MessageComponent {...message} key={i} />)}
      </div>
    );
  }
}
