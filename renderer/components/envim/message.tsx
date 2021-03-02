import React from "react";

import { IMessage } from "../../../common/interface";

import { Setting } from "../../utils/setting";
import { Highlights } from "../../utils/highlight";
import { notificates } from "../../utils/icons";

import { IconComponent } from "../icon";

interface Props {
  message: IMessage;
  open: boolean;
  onClick: (...args: any[]) => void;
}

interface States {
}

const whiteSpaceP: "pre-wrap" = "pre-wrap";
const whiteSpaceN: "nowrap" = "nowrap";
const wordBreak: "break-all" = "break-all";
const styles = {
  content: {
    display: "flex",
    cursor: "pointer",
  },
  kind: {
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

  render() {
    const icon = notificates.filter(icon => icon.kinds.indexOf(this.props.message.kind) >= 0)[0];
    const lineHeight = `${Setting.font.height + 4}px`;

    return (
      <div style={{ lineHeight, ...styles.content, ...Highlights.style(0) }} onClick={this.props.onClick}>
        <IconComponent color={icon.color} style={styles.kind} font={icon.font} />
        <div style={ this.props.open ? styles.open : styles.close }>
          {this.props.message.contents.map(({hl, content}, i) => hl === 0 ? content : <span style={Highlights.style(hl)} className="selectable" key={i}>{ content }</span>)}
        </div>
      </div>
    );
  }
}
