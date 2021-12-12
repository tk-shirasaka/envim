import React from "react";

import { IMessage } from "../../../common/interface";

import { Highlights } from "../../utils/highlight";
import { notificates } from "../../utils/icons";

import { FlexComponent } from "../flex";
import { IconComponent } from "../icon";

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
    cursor: "pointer",
  },
  open: {
    wordBreak,
    whiteSpace: whiteSpaceP,
  },
  close: {
    whiteSpace: whiteSpaceN,
    textOverflow: "ellipsis",
    overflow: "hidden"
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
      <FlexComponent style={styles.scope} onClick={this.props.onClick}>
        <IconComponent font={icon.font} style={Highlights.style(defaultHl, true)} />
        <FlexComponent className="selectable space" grow={1} shrink={1} padding={[2, 4]} style={defaultStyle}>
          <div style={this.props.open ? styles.open : styles.close}>
            {this.props.message.contents.map(({hl, content}, i) => <span style={this.contentStyle(defaultStyle, hl === defaultHl ? defaultStyle : Highlights.style(hl))} key={i}>{ content }</span>)}
          </div>
        </FlexComponent>
      </FlexComponent>
    );
  }
}
