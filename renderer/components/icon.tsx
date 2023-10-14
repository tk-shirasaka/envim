import React from "react";

import { FlexComponent } from "./flex";

interface Props {
  font: string;
  color?: string;
  style?: { [k: string]: number | string };
  text?: number | string;
  hover?: boolean;
  active?: boolean;
  float?: "left" | "right";
  onClick?: (...args: any[]) => void,
}

interface States {
}

const whiteSpace: "nowrap" = "nowrap";
const styles = {
  text: {
    display: "inline",
    paddingLeft: 4,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace,
  },
};

export class IconComponent extends React.Component<Props, States> {
  render() {
    const float = this.props.float;
    const style = this.props.style || {};

    if (float) {
      style.transform = "translateY(-50%)";
      style.lineHeight = 1;
      style.top = "50%";
      style[float] = 2;
    }

    return (
      <FlexComponent vertical="center" position={float && "absolute"} rounded={float && [4]} padding={[4]} spacing={!float} shrink={1} style={style} { ...this.props }>
        <i>{ this.props.font }</i>
        { this.props.text && <div style={styles.text}>{ this.props.text }</div> }
      </FlexComponent>
    )
  }
}
