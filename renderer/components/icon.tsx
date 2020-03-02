import React from "react";

import { font } from "../utils/font";

interface Props {
  font: string;
  color: string;
  style: { [k: string]: number | string };
  raito?: number;
  active?: boolean;
  onClick?: (...args: any[]) => void,
}

interface States {
}

export class IconComponent extends React.Component<Props, States> {
  render() {
    const { size } = font.get();
    const className = `color-${this.props.color} ${this.props.active ? "active" : this.props.onClick ? "clickable" : ""}`;
    const style = {
      ...this.props.style,
      fontSize: (this.props.raito || 1) * size + 8,
    };

    return (
      <i {...{ className, style }} onClick={this.props?.onClick}>
        { this.props.font }
      </i>
    )
  }
}
