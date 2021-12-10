import React, { createRef, RefObject } from "react";

interface Props {
  label: string;
  color: string;
  style: Object;
  onClick?: (...args: any[]) => void;
}

interface States {
  active: boolean;
}

const positionR: "relative" = "relative";
const positionA: "absolute" = "absolute";
const whiteSpace: "nowrap" = "nowrap";
const styles = {
  scope: {
    position: positionR,
  },
  menu: {
    zIndex: 20,
    padding: 4,
    whiteSpace,
    position: positionA,
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: "solid",
    boxShadow: "4px 4px 4px 0 rgba(0, 0, 0, 0.6)",
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
      this.align = window.innerWidth / 2 < this.div.current?.offsetLeft ? "right" : "left";
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
    return this.state.active === false || this.haschild === false ? null : (
      <div style={styles.scope}>
        <div className="color-black" style={{ ...styles.menu, ...(this.align === "left" ? styles.left : styles.right) }}>
          { this.props.children }
        </div>
      </div>
    );
  }

  render() {
    return (
      <div onMouseEnter={this.onMouseEnter.bind(this)} onMouseLeave={this.onMouseLeave.bind(this)} ref={this.div}>
        <div className={`color-${this.props.color} clickable`} style={this.props.style} onClick={this.props?.onClick}>{ this.props.label }</div>
        { this.renderMenu() }
      </div>
    );
  }
}
