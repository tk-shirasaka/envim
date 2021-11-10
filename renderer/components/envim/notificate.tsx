import React from "react";

import { IMessage } from "../../../common/interface";

import { Emit } from "../../utils/emit";

import { MessageComponent } from "./message";

interface Props {
}

interface States {
  messages: IMessage[];
}

const position: "absolute" = "absolute";
const overflowX: "hidden" = "hidden";
const overflowY: "auto" = "auto";
const styles = {
  scope: {
    position,
    overflowX,
    overflowY,
    zIndex: 10,
    right: 0,
    width: 300,
    maxHeight: "100%",
  },
  messages: {
    margin: 8,
    overflowX,
    overflowY,
    borderRadius: 4,
    boxShadow: "0 0 8px 0 rgba(0, 0, 0, 0.6)",
  },
};

export class NotificateComponent extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);

    this.state = { messages: [] };
    Emit.on("messages:show", this.onShow.bind(this));
    Emit.on("messages:clear", this.onClear.bind(this));
  }

  componentWillUnmount() {
    Emit.clear(["messages:show", "messages:clear"]);
  }

  private onShow(message: IMessage, replace: boolean) {
    const messages = replace ? [] : this.state.messages.slice(-1);

    this.setState({ messages: [ ...messages, message ] });
  }

  private onClear() {
    this.setState({ messages: [] });
  }

  private onClose(i: number) {
    const messages = this.state.messages;

    messages.splice(i, 1);
    this.setState({ messages });
  }

  render() {
    return this.state.messages.length === 0 ? null : (
      <div style={styles.scope}>
        {this.state.messages.map((message, i) =>
          <div className="animate slide-right" style={styles.messages} key={i}><MessageComponent message={message} open={true} onClick={() => this.onClose(i)} /></div>
        )}
      </div>
    );
  }
}
