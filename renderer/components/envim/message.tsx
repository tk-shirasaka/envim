import React from "react";

import { notificate } from "../../utils/icons";
import { Highlights } from "../../utils/highlight";
import { font } from "../../utils/font";

interface Props {
  kind: string;
  content: string[][];
  scrollable: boolean;
}

interface States {
}

const styles = {
  content: {
    display: "flex",
    width: "100%",
    height: "100%",
  },
  kind: {
    padding: "4px 8px",
  },
  message: {
    margin: 0,
    padding: 4,
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
    const style = {
      ...styles.kind,
      color: Highlights.color(0, "background"),
      background: Highlights.color(0, "foreground"),
      fontSize: size,
    };

    return <i style={style}>{ notificate(kind) }</i>
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
        <pre style={{...styles.message, overflow: this.props.scrollable ? "scroll" : "hidden"}}>
          {this.props.content.map(([hl, message], i) => <span style={this.getMessageStyle(+hl)} key={i}>{ message }</span>)}
        </pre>
      </div>
    );
  }
}
