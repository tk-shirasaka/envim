import React from "react";

import { FlexComponent } from "./flex";

interface Props {
  font: string;
  color?: string;
  style?: { [k: string]: number | string };
  text?: number | string;
  hover?: boolean;
  active?: boolean;
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
    return (
      <FlexComponent vertical="center" shrink={1} padding={[0, 4]} { ...this.props }>
        <i>{ this.props.font }</i>
        { this.props.text && <div style={styles.text}>{ this.props.text }</div> }
      </FlexComponent>
    )
  }
}
