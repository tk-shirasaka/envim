import React, { createRef, RefObject } from "react";

import { FlexComponent } from "./flex";

interface Props {
  side?: boolean;
  label: string;
  color: string;
  style: Object;
  onClick?: (...args: any[]) => void;
}

interface States {
  haschild: boolean;
}

const whiteSpace: "nowrap" = "nowrap";
const boxSizing: "border-box" = "border-box";
const styles = {
  menu: {
    zIndex: 20,
    minWidth: "100%",
    whiteSpace,
    boxSizing,
  },
  vleft: {
    left: 0,
  },
  vright: {
    right: 0,
  },
  hleft: {
    left: "100%",
  },
  hright: {
    right: "100%",
  },
};

export class MenuComponent extends React.Component<Props, States> {
  private div: RefObject<HTMLDivElement> = createRef<HTMLDivElement>();
  private align: "left" | "right" = "left";

  constructor(props: Props) {
    super(props);
    this.state = { haschild: false };
  }

  componentDidMount() {
    this.updateProperty();
  }

  componentDidUpdate() {
    this.updateProperty();
  }

  private onClick() {
  }

  private updateProperty() {
    const haschild = !(Array.isArray(this.props.children) && this.props.children.length === 0);

    this.state.haschild === haschild || this.setState({ haschild });

    if (this.div.current) {
      const { left } = this.div.current.getBoundingClientRect();
      this.align = window.innerWidth / 2 < left ? "right" : "left";
    }
  }

  private renderMenu(direction: "v" | "h") {
    if (this.state.haschild === false || (this.props.side ? "h" : "v") !== direction) return null;

    const style = { ...styles.menu, ...(styles[`${direction}${this.align}`]) };

    return (
      <FlexComponent overflow="visible" hover>
        <FlexComponent color="black" direction="column" position="absolute" overflow="visible" padding={[4]} border={[1]} rounded={[2]} style={style} shadow>
          { this.props.children }
        </FlexComponent>
      </FlexComponent>
    );
  }

  render() {
    return (
      <FlexComponent vertical="center" overflow="visible">
        <div className="animate hover space" ref={this.div}>
          { this.renderMenu("h") }
          <FlexComponent color={this.props.color} style={this.props.style} onClick={this.props.onClick || this.onClick}>{ this.props.label }</FlexComponent>
          { this.renderMenu("v") }
        </div>
      </FlexComponent>
    );
  }
}
