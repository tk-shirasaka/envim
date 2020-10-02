import React from "react";

import { Setting } from "../utils/setting";

interface Props {
  font: string;
  color: string;
  style: { [k: string]: number | string };
  text?: number | string;
  animation?: string;
  active?: boolean;
  onClick?: (...args: any[]) => void,
}

interface States {
}

const styles = {
  scope: {
    display: "inline-block",
  },
  text: {
    display: "inline",
    paddingLeft: 4,
  },
};

export class IconComponent extends React.Component<Props, States> {
  render() {
    const { size, height } = Setting.font;
    const classes = [`color-${this.props.color}`];
    const style = { fontSize: size, lineHeight: `${height}px` };

    this.props.active && classes.push("active");
    this.props.onClick && classes.push("clickable");
    this.props.animation && classes.push(`animate ${this.props.animation}`);

    return (
      <div className={classes.join(" ")} style={{...styles.scope, ...this.props.style}} onClick={this.props?.onClick}>
        <i style={style}>{ this.props.font }</i>
        { this.props.text && <div style={styles.text}>{ this.props.text }</div> }
      </div>
    )
  }
}
