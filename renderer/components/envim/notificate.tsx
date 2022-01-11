import React from "react";

import { IMessage } from "../../../common/interface";

import { Emit } from "../../utils/emit";

import { FlexComponent } from "../flex";
import { MessageComponent } from "./message";

interface Props {
}

interface States {
  messages: IMessage[];
}

const styles = {
  scope: {
    overflow: "hidden auto",
    zIndex: 20,
    right: 0,
    bottom: 0,
    width: 300,
    maxHeight: "100%",
  },
  messages: {
    overflow: "hidden auto",
  },
};

export class NotificateComponent extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);

    this.state = { messages: [] };
    Emit.on("messages:show", this.onShow);
    Emit.on("messages:clear", this.onClear);
  }

  componentWillUnmount() {
    Emit.clear(["messages:show", "messages:clear"]);
  }

  private onShow = (message: IMessage, replace: boolean) => {
    const messages = replace ? [] : this.state.messages.slice(-1);

    this.setState({ messages: [ ...messages, message ] });
  }

  private onClear = () => {
    this.setState({ messages: [] });
  }

  render() {
    return this.state.messages.length === 0 ? null : (
      <FlexComponent direction="column-reverse" padding={[0, 4]} position="absolute" style={styles.scope}>
        {this.state.messages.map((message, i) =>
          <FlexComponent animate="slide-right" margin={[4, 0]} rounded={[4]} style={styles.messages} key={i} shadow><MessageComponent message={message} open /></FlexComponent>
        )}
      </FlexComponent>
    );
  }
}
