import React, { PropsWithChildren, createRef, RefObject } from "react";

import { FlexComponent } from "./flex";

interface Props {
  side?: boolean;
  horizontal?: boolean;
  label: string;
  color?: string;
  active?: boolean;
  fit?: boolean;
}

interface States {
  haschild: boolean;
}

const position: "relative" = "relative";
const whiteSpace: "nowrap" = "nowrap";
const styles = {
  wrap: {
    position,
    display: "flex",
    width: "100%",
    height: "100%",
  },
  menu: {
    minWidth: "100%",
    lineHeight: 1.5,
    whiteSpace,
  },
  sidemenu: {
    lineHeight: 1.5,
    whiteSpace,
  },
};

export class MenuComponent extends React.Component<PropsWithChildren<Props>, States> {
  private div: RefObject<HTMLDivElement> = createRef<HTMLDivElement>();
  private inset: (0 | "100%" | "auto")[] = ["auto", "auto", "auto", "auto"];

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

  private onClick() { }

  private updateProperty() {
    const haschild = !(Array.isArray(this.props.children) && this.props.children.length === 0);

    this.state.haschild === haschild || this.setState({ haschild });

    if (this.div.current) {
      const { top, left } = this.div.current.getBoundingClientRect();
      const vert = window.innerHeight / 2 < top ? "top" : "bottom";
      const hori = window.innerWidth / 2 < left ? "left" : "right";

      this.inset = ["auto", "auto", "auto", "auto"];
      if (vert === "bottom") {
        this.inset[0] = this.props.side ? 0 : "100%";
      }
      if (hori === "left") {
        this.inset[1] = this.props.side ? "100%" : 0;
      }
      if (vert === "top") {
        this.inset[2] = this.props.side ? 0 : "100%";
      }
      if (hori === "right") {
        this.inset[3] = this.props.side ? "100%" : 0;
      }
    }
  }

  private renderMenu() {
    if (this.state.haschild === false) return null;

    const base = this.props.side ? styles.sidemenu : styles.menu;
    const style = { ...base, ...{ inset: this.inset.join(" "), maxWidth: window.innerWidth - 20, minWidth: Math.min(this.props.fit ? 0 : 150, window.innerWidth / 2 - 20) } };
    const direction = this.props.horizontal ? "row" : "column";

    return (
      <FlexComponent color="default" direction={direction} position="absolute" overflow="visible" zIndex={20} rounded={[2]} style={style} shadow hover>
        { this.props.children }
      </FlexComponent>
    );
  }

  render() {
    return (
      <FlexComponent vertical="center" overflow="visible">
        <div className="animate hover space" style={styles.wrap} ref={this.div}>
          <FlexComponent grow={1} vertical="center" color={this.props.color} onClick={this.onClick} active={this.props.active} spacing>{ this.props.label }</FlexComponent>
          { this.renderMenu() }
        </div>
      </FlexComponent>
    );
  }
}
