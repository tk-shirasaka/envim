import React from "react";

import { Highlights } from "../../utils/highlight";
import { notificates } from "../../utils/icons";

import { IconComponent } from "../icon";

interface Props {
  kind: string;
  content: string[][];
}

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
          {this.props.content.map(([hl, message], i) => +hl === 0 ? message : <span style={Highlights.style(+hl)} key={i}>{ message }</span>)}
        </pre>
      </div>
    );
  }
}
