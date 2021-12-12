import React, { createRef, RefObject } from "react";

import { FlexComponent } from "./flex";

interface Props {
  label: string;
  color: string;
  style: Object;
  onClick?: (...args: any[]) => void;
}

interface States {
  active: boolean;
}

const whiteSpace: "nowrap" = "nowrap";
const styles = {
  scope: {
    overflow: "visible",
  },
  menu: {
    zIndex: 20,
    overflow: "visible",
    whiteSpace,
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
  private haschild: boolean = false;

  constructor(props: Props) {
    super(props);
    this.state = { active: false };
  }

  componentDidMount() {
    this.updateProperty();
  }

  componentDidUpdate() {
    this.updateProperty();
  }

  private updateProperty() {
    if (this.div.current) {
      const { left } = this.div.current.getBoundingClientRect();
      this.align = window.innerWidth / 2 < left ? "right" : "left";
    }
    this.haschild = this.haschild && !!this.props.children && !(Array.isArray(this.props.children) && this.props.children.length === 0);
  }

  onMouseEnter() {
    this.haschild = !!this.props.children && !(Array.isArray(this.props.children) && this.props.children.length === 0);
    this.setState({ active: true });
  }

  onMouseLeave() {
    this.setState({ active: false });
  }

  private renderMenu() {
    const style = { ...styles.menu, ...(this.align === "left" ? styles.left : styles.right) };

    return this.state.active === false || this.haschild === false ? null : (
      <FlexComponent style={styles.scope}>
        <FlexComponent className="color-black" direction="column" position="absolute" padding={[4]} border={[1]} rounded={[4]} shadow={true} style={style}>
          { this.props.children }
        </FlexComponent>
      </FlexComponent>
    );
  }

  render() {
    return (
      <FlexComponent vertical="center" style={styles.scope} onMouseEnter={this.onMouseEnter.bind(this)} onMouseLeave={this.onMouseLeave.bind(this)}>
        <div ref={this.div}>
          <div className={`color-${this.props.color} clickable`} style={this.props.style} onClick={this.props?.onClick}>{ this.props.label }</div>
          { this.renderMenu() }
        </div>
      </FlexComponent>
    );
  }
}
