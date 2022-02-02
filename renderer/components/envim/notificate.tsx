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
  }

  componentWillUnmount = () => {
    Emit.off("messages:show", this.onShow);
  }

  private onShow = (messages: IMessage[], replace: boolean) => {
    replace && this.state.messages.splice(0);

    this.setState({ messages: [ ...this.state.messages, ...messages ] });
  }

  render() {
    return this.state.messages.length === 0 ? null : (
      <FlexComponent direction="column" padding={[0, 4]} inset={["auto", 0, 0, "auto"]} position="absolute" style={styles.scope}>
        {this.state.messages.map((message, i) =>
          <FlexComponent animate="slide-right" margin={[4, 0]} rounded={[4]} style={styles.messages} key={i} shadow><MessageComponent message={message} open /></FlexComponent>
        )}
      </FlexComponent>
    );
  }
}
