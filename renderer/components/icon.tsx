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

export function IconComponent(props: Props) {
  const float = props.float;
  const style = props.style || {};

  if (float) {
    style.transform = "translateY(-50%)";
    style.lineHeight = 1;
    style.top = "50%";
    style[float] = 2;
  }

  return (
    <FlexComponent vertical="center" position={float && "absolute"} rounded={float && [4]} padding={[4]} spacing={!float} shrink={1} style={style} { ...props }>
      <i>{ props.font }</i>
      { props.text && <div style={styles.text}>{ props.text }</div> }
    </FlexComponent>
  );
}
