import React from "react";

import { Setting } from "../utils/setting";

interface Props {
  font: string;
  color: string;
  style: { [k: string]: number | string };
  active?: boolean;
  onClick?: (...args: any[]) => void,
}

interface States {
}

export class IconComponent extends React.Component<Props, States> {
  render() {
    const { size, height } = Setting.font;
    const className = `color-${this.props.color} ${this.props.active ? "active" : this.props.onClick ? "clickable" : ""}`;
    const style = {fontSize: size / 2 * 3, lineHeight: `${height}px`, ...this.props.style};

    return (
      <i {...{ className, style }} onClick={this.props?.onClick}>
        { this.props.font }
      </i>
    )
  }
}
