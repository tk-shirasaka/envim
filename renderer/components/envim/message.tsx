import React from "react";

import { IMessage } from "../../../common/interface";

import { Highlights } from "../../utils/highlight";
import { notificates } from "../../utils/icons";

import { IconComponent } from "../icon";

interface Props {
  message: IMessage;
  open: boolean;
  onClick: (...args: any[]) => void;
}

interface States {
  open: boolean;
}

const whiteSpaceP: "pre-wrap" = "pre-wrap";
const whiteSpaceN: "nowrap" = "nowrap";
const wordBreak: "break-all" = "break-all";
const styles = {
  content: {
    display: "flex",
    overflow: "hidden",
    cursor: "pointer",
  },
  kind: {
    padding: "2px 4px",
  },
  open: {
    width: "100%",
    padding: "2px 4px",
    whiteSpace: whiteSpaceP,
    wordBreak,
  },
  close: {
    width: "100%",
    padding: "2px 4px",
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace: whiteSpaceN,
  },
};

export class MessageComponent extends React.Component<Props, States> {

  private getKind(kind: string) {
    const icon = notificates.filter(icon => icon.kinds.indexOf(kind) >= 0)[0];

    return <IconComponent color={icon.color} style={styles.kind} font={icon.font} />;
  }

  render() {
    return (
      <div style={{...styles.content, ...Highlights.style(0)}} onClick={this.props.onClick}>
        {this.getKind(this.props.message.kind)}
        <div style={this.props.open ? styles.open : styles.close}>
          {this.props.message.contents.map(({hl, content}, i) => hl === 0 ? content : <span style={Highlights.style(hl)} key={i}>{ content }</span>)}
        </div>
      </div>
    );
  }
}
