import React, { PropsWithChildren, createRef, RefObject } from "react";

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

const position: "relative" = "relative";
const whiteSpace: "nowrap" = "nowrap";
const styles = {
  wrap: {
    position,
  },
  menu: {
    zIndex: 20,
    minWidth: "100%",
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

  private onClick() {
  }

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

    const style = { ...styles.menu, ...{ inset: this.inset.join(" ") } };

    return (
      <FlexComponent color="default" direction="column" position="absolute" overflow="visible" padding={[4]} border={[1]} rounded={[2]} style={style} shadow hover>
        { this.props.children }
      </FlexComponent>
    );
  }

  render() {
    return (
      <FlexComponent vertical="center" overflow="visible">
        <div className="animate hover space" style={styles.wrap} ref={this.div}>
          <FlexComponent color={this.props.color} style={this.props.style} onClick={this.props.onClick || this.onClick}>{ this.props.label }</FlexComponent>
          { this.renderMenu() }
        </div>
      </FlexComponent>
    );
  }
}
