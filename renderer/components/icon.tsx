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
    const { size } = Setting.font;
    const className = `color-${this.props.color} ${this.props.active ? "active" : this.props.onClick ? "clickable" : ""}`;
    const style = {fontSize: size + 8, lineHeight: `${size + 1}px`, ...this.props.style};

    return (
      <i {...{ className, style }} onClick={this.props?.onClick}>
        { this.props.font }
      </i>
    )
  }
}
