import React from "react";

import { IMessage } from "../../../common/interface";

import { Setting } from "../../utils/setting";
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
    padding: "0px 4px",
  },
  open: {
    wordBreak,
    whiteSpace: whiteSpaceP,
    padding: "0px 4px",
  },
  close: {
    whiteSpace: whiteSpaceN,
    textOverflow: "ellipsis",
    overflow: "hidden",
    padding: "0px 4px",
  },
};

export class MessageComponent extends React.Component<Props, States> {

  private contentStyle(defaultStyle: { [k: string]: string }, style: { [k: string]: string }) {
    return { ...style, ...(defaultStyle.background === style.background ? { background: "" } : {}) };
  }

  render() {
    const icon = notificates.filter(icon => icon.kinds.indexOf(this.props.message.kind) >= 0)[0];
    const lineHeight = `${Setting.font.height + 4}px`;
    const defaultHl = this.props.message.contents[0].hl;
    const defaultStyle = Highlights.style(defaultHl);

    return (
      <div style={{ lineHeight, ...styles.scope, ...defaultStyle }} onClick={this.props.onClick}>
        <i style={{ ...styles.kind, ...Highlights.style(defaultHl, true) }}>{ icon.font }</i>
        <div className="selectable space" style={ this.props.open ? styles.open : styles.close }>
          {this.props.message.contents.map(({hl, content}, i) => <span style={this.contentStyle(defaultStyle, hl === defaultHl ? defaultStyle : Highlights.style(hl))} key={i}>{ content }</span>)}
        </div>
      </div>
    );
  }
}
