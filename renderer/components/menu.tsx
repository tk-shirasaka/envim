import React, { createRef, RefObject } from "react";

import { FlexComponent } from "./flex";

interface Props {
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
  left: {
    left: 0,
  },
  right: {
    right: 0,
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

  private updateProperty() {
    const haschild = !(Array.isArray(this.props.children) && this.props.children.length === 0);

    this.state.haschild === haschild || this.setState({ haschild });

    if (this.div.current) {
      const { left } = this.div.current.getBoundingClientRect();
      this.align = window.innerWidth / 2 < left ? "right" : "left";
    }
  }

  private renderMenu() {
    const style = { ...styles.menu, ...(this.align === "left" ? styles.left : styles.right) };

    return this.state.haschild === false ? null : (
      <FlexComponent className="contents" overflow="visible">
        <FlexComponent className="color-black" direction="column" position="absolute" overflow="visible" padding={[4]} border={[1]} rounded={[4]} shadow={true} style={style}>
          { this.props.children }
        </FlexComponent>
      </FlexComponent>
    );
  }

  render() {
    return (
      <FlexComponent vertical="center" overflow="visible">
        <div className="animate hover" ref={this.div}>
          <div className={`color-${this.props.color} clickable`} style={this.props.style} onClick={this.props?.onClick}>{ this.props.label }</div>
          { this.renderMenu() }
        </div>
      </FlexComponent>
    );
  }
}
