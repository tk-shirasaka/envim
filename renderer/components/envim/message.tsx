import React from "react";

import { IMessage } from "../../../common/interface";

import { Highlights } from "../../utils/highlight";
import { notificates } from "../../utils/icons";

import { IconComponent } from "../icon";

type Props = IMessage;

interface States {
}

const whiteSpace: "pre-wrap" = "pre-wrap";
const wordBreak: "break-all" = "break-all";
const styles = {
  content: {
    display: "flex",
    overflow: "hidden",
  },
  kind: {
    padding: "2px 4px",
  },
  message: {
    width: "100%",
    padding: "2px 4px",
    whiteSpace,
    wordBreak,
  },
};

export class MessageComponent extends React.Component<Props, States> {

  private getKind(kind: string) {
    const icon = notificates.filter(icon => icon.kinds.indexOf(kind) >= 0)[0];

    return <IconComponent color={icon.color} style={styles.kind} font={icon.font} />;
  }

  render() {
    return (
      <div style={{...styles.content, ...Highlights.style(0)}}>
        {this.getKind(this.props.kind)}
        <div style={styles.message}>
          {this.props.contents.map(({hl, content}, i) => hl === 0 ? content : <span style={Highlights.style(hl)} key={i}>{ content }</span>)}
        </div>
      </div>
    );
  }
}
