import React from "react";

import { IMessage } from "../../../common/interface";

import { Highlights } from "../../utils/highlight";
import { notificates } from "../../utils/icons";

interface Props {
  message: IMessage;
  open: boolean;
  onClick?: (...args: any[]) => void;
}

interface States {
}

const whiteSpaceP: "pre-wrap" = "pre-wrap";
const whiteSpaceN: "nowrap" = "nowrap";
const wordBreak: "break-all" = "break-all";
const styles = {
  scope: {
    display: "flex",
    cursor: "pointer",
  },
  kind: {
    display: "inline-block",
    padding: "2px 4px",
    textDecoration: "",
  },
  open: {
    wordBreak,
    whiteSpace: whiteSpaceP,
    padding: "2px 4px",
  },
  close: {
    whiteSpace: whiteSpaceN,
    textOverflow: "ellipsis",
    overflow: "hidden",
    padding: "2px 4px",
  },
};

export class MessageComponent extends React.Component<Props, States> {

  private contentStyle(defaultStyle: { [k: string]: string }, style: { [k: string]: string }) {
    return { ...style, ...(defaultStyle.background === style.background ? { background: "" } : {}) };
  }

  render() {
    if (this.props.message.contents.length === 0) return null;

    const icon = notificates.filter(icon => icon.kinds.indexOf(this.props.message.kind) >= 0)[0];
    const defaultHl = this.props.message.contents[0].hl;
    const defaultStyle = Highlights.style(defaultHl);

    return (
      <div style={styles.scope} onClick={this.props.onClick}>
        <i style={{ ...Highlights.style(defaultHl, true), ...styles.kind }}>{ icon.font }</i>
        <div className="selectable space" style={{ ...defaultStyle, ...(this.props.open ? styles.open : styles.close) }}>
          {this.props.message.contents.map(({hl, content}, i) => <span style={this.contentStyle(defaultStyle, hl === defaultHl ? defaultStyle : Highlights.style(hl))} key={i}>{ content }</span>)}
        </div>
      </div>
    );
  }
}
