import React from "react";

import { IMessage } from "../../../common/interface";

import { Emit } from "../../utils/emit";
import { Highlights } from "../../utils/highlight";
import { notificates } from "../../utils/icons";

import { IconComponent } from "../icon";
import { MessageComponent } from "./message";

interface Props {
  width: number;
  height: number;
}

interface States {
  filter: string[],
  messages: IMessage[];
}

const positionF: "fixed" = "fixed";
const positionS: "sticky" = "sticky";
const styles = {
  scope: {
    position: positionF,
    left: 0,
    right: 0,
    bottom: 0,
    animation: "slideIn .5s ease",
    borderRadius: "4px 4px 0 0",
    boxShadow: "0 -8px 4px 0 rgba(0, 0, 0, 0.6)",
    overflow: "auto",
  },
  actions: {
    position: positionS,
    display: "flex",
    top: 0,
  },
  icon: {
    padding: "2px 4px",
  },
};

export class HistoryComponent extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);

    this.state = { filter: [], messages: [] };
    Emit.on("envim:focus", this.onClose.bind(this));
    Emit.on("messages:history", this.onHistory.bind(this));
  }

  componentWillUnmount() {
    Emit.clear(["envim:focus", "messages:history"]);
  }

  private onClear() {
    Emit.send("envim:command", "messages clear");
    this.setState({ messages: [] });
  }

  private onFilter(kinds: string[]) {
    this.setState({ filter: this.state.filter === kinds ? [] : kinds });
  }

  private onClose() {
    this.setState({ messages: [] });
  }

  private onHistory(messages: IMessage[]) {
    this.setState({ messages });
  }

  render() {
    return this.state.messages.length === 0 ? null : (
      <div style={{...styles.scope, ...this.props, ...Highlights.style(0)}}>
        <div className="color-white" style={styles.actions}>
          <IconComponent color="red-fg" style={styles.icon} font="ﰸ" onClick={this.onClear.bind(this)} />
          <div className="space" />
          {notificates.filter(icon => icon.filter).map((icon, i) => (
            <IconComponent color={`${icon.color}-fg`} active={icon.kinds === this.state.filter} style={styles.icon} font={icon.font} onClick={() => this.onFilter(icon.kinds)} key={i} />)
          )}
          <IconComponent color="black-fg" style={styles.icon} font="" onClick={this.onClose.bind(this)} />
        </div>
        {this.state.messages.map((message, i) => (
          (this.state.filter.length && this.state.filter.indexOf(message.kind) < 0) || <div key={i}><MessageComponent {...message} /></div>
        ))}
      </div>
    );
  }
}
