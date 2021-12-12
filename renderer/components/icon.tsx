import React from "react";

import { FlexComponent } from "./flex";

interface Props {
  font: string;
  color?: string;
  style?: { [k: string]: number | string };
  text?: number | string;
  active?: boolean;
  onClick?: (...args: any[]) => void,
}

interface States {
}

const styles = {
  text: {
    display: "inline",
    paddingLeft: 4,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
};

export class IconComponent extends React.Component<Props, States> {
  render() {
    const classes = [];

    this.props.color && classes.push(`color-${this.props.color}`);
    this.props.active && classes.push("active");
    this.props.onClick && classes.push("clickable");

    return (
      <FlexComponent className={classes.join(" ")} vertical="center" padding={[2, 4]} style={this.props.style} onClick={this.props.onClick}>
        <i>{ this.props.font }</i>
        { this.props.text && <div style={styles.text}>{ this.props.text }</div> }
      </FlexComponent>
    )
  }
}
