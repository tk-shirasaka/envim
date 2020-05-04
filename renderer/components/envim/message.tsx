import React from "react";

import { IMessage } from "../../../common/interface";

import { Highlights } from "../../utils/highlight";
import { notificates } from "../../utils/icons";

import { IconComponent } from "../icon";

type Props = IMessage;

interface States {
}

const whiteSpace: "pre-wrap" = "pre-wrap";
const styles = {
  content: {
    display: "flex",
    width: "100%",
    height: "100%",
  },
  kind: {
    padding: 4,
  },
  message: {
    width: "100%",
    margin: 0,
    padding: 4,
    overflow: "auto",
    whiteSpace,
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
        <pre style={styles.message}>
          {this.props.contents.map(({hl, content}, i) => hl === 0 ? content : <span style={Highlights.style(hl)} key={i}>{ content }</span>)}
        </pre>
      </div>
    );
  }
}
