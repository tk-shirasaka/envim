import React from "react";

import { Highlights } from "../../utils/highlight";
import { notificates } from "../../utils/icons";
import { font } from "../../utils/font";

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
    padding: "0 8px",
  },
  message: {
    margin: 0,
    padding: 4,
    overflow: "auto",
    whiteSpace,
  },
};

export class MessageComponent extends React.Component<Props, States> {

  private getContentStyle() {
    return {
      ...styles.content,
      color: Highlights.color(0, "foreground"),
      background: Highlights.color(0, "background"),
    };
  }

  private getKind(kind: string) {
    const { size } = font.get();
    const icon = notificates.filter(icon => icon.kinds.indexOf(kind) >= 0)[0];
    const style = {
      ...styles.kind,
      fontSize: size + 8,
    };

    return <i className={`color-${icon.color} clickable`} style={style}>{ icon.font }</i>
  }

  private getMessageStyle(hl: number) {
    return {
      color: Highlights.color(hl, "foreground"),
      background: Highlights.color(hl, "background"),
    };
  }

  render() {
    return (
      <div style={this.getContentStyle()}>
        {this.getKind(this.props.kind)}
        <pre style={styles.message}>
          {this.props.content.map(([hl, message], i) => +hl === 0 ? message : <span style={this.getMessageStyle(+hl)} key={i}>{ message }</span>)}
        </pre>
      </div>
    );
  }
}
