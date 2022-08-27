import React from "react";

import { IMessage } from "../../../common/interface";

import { Highlights } from "../../utils/highlight";
import { notificates } from "../../utils/icons";

import { FlexComponent } from "../flex";
import { IconComponent } from "../icon";

interface Props {
  message: IMessage;
  open: boolean;
  noaction?: boolean;
}

interface States {
  open: boolean;
  delete: boolean;
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

    this.state = { open: this.props.open, delete: false };
  }

  private onToggleOpen = () => {
    this.setState({ open: !this.state.open });
  }

  private onDelete = () => {
    this.setState({ delete: true });
  }

  private contentStyle(defaultStyle: { [k: string]: string }, style: { [k: string]: string }) {
    return { ...style, ...(defaultStyle.background === style.background ? { background: "" } : {}) };
  }

  render() {
    if (this.props.message.contents.length === 0 || this.state.delete) return null;

    const icon = notificates.filter(icon => icon.kinds.indexOf(this.props.message.kind) >= 0)[0];
    const defaultHl = this.props.message.contents[0].hl;
    const defaultStyle = Highlights.style(defaultHl);

    return (
      <FlexComponent animate="hover" grow={1} basis="0">
        <IconComponent font={icon.font} style={Highlights.style(defaultHl, { reverse: true, normal: true })} />
        <FlexComponent whiteSpace={this.state.open ? "pre-wrap" : "nowrap"} grow={1} shrink={1} basis="0" padding={[2, 4]} style={defaultStyle} selectable>
          <div style={styles.message}>
            {this.props.message.contents.map(({hl, content}, i) => <span style={this.contentStyle(defaultStyle, hl === defaultHl ? defaultStyle : Highlights.style(hl))} key={i}>{ content }</span>)}
          </div>
        </FlexComponent>
        { this.props.noaction ? null : (
          <FlexComponent color="default" vertical="end" overflow="visible" position="absolute" inset={["auto", 0, 0]} style={styles.action} hover>
            <div className="space" />
            <FlexComponent color="default" shrink={1} padding={[0, 4]} rounded={[4, 0, 0, 0]} shadow>
              <IconComponent color="gray-fg" font={this.state.open ? "" : "ﬥ"} onClick={this.onToggleOpen} />
              <IconComponent color="gray-fg" font="" onClick={this.onDelete}/>
            </FlexComponent>
          </FlexComponent>
        ) }
      </FlexComponent>
    );
  }
}
