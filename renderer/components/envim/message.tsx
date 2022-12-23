import React from "react";

import { IMessage } from "../../../common/interface";

import { Highlights } from "../../utils/highlight";
import { notificates } from "../../utils/icons";

import { FlexComponent } from "../flex";
import { IconComponent } from "../icon";

interface Props {
  message: IMessage;
  open: boolean;
}

interface States {
  open: boolean;
}

const styles = {
  message: {
    textOverflow: "ellipsis",
    overflow: "hidden"
  },
  action: {
    height: 1,
  },
};

export class MessageComponent extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);

    this.state = { open: this.props.open };
  }

  private onToggleOpen = () => {
    this.setState({ open: !this.state.open });
  }

  private contentStyle(defaultStyle: { [k: string]: string }, style: { [k: string]: string }) {
    return { ...style, ...(defaultStyle.background === style.background ? { background: "" } : {}) };
  }

  render() {
    if (this.props.message.contents.length === 0) return null;

    const icon = notificates.filter(icon => icon.kinds.indexOf(this.props.message.kind) >= 0)[0];
    const defaultHl = this.props.message.contents[0].hl;
    const defaultStyle = Highlights.style(defaultHl);

    return (
      <FlexComponent grow={1} basis="0" onClick={this.onToggleOpen}>
        <IconComponent font={icon.font} style={Highlights.style(defaultHl, { reverse: true, normal: true })} />
        <FlexComponent whiteSpace={this.state.open ? "pre-wrap" : "nowrap"} grow={1} shrink={1} basis="0" padding={[2, 4]} style={defaultStyle} selectable>
          <div style={styles.message}>
            {this.props.message.contents.map(({hl, content}, i) => <span style={this.contentStyle(defaultStyle, hl === defaultHl ? defaultStyle : Highlights.style(hl))} key={i}>{ content }</span>)}
          </div>
        </FlexComponent>
      </FlexComponent>
    );
  }
}
