import React, { PropsWithChildren, createRef, RefObject, MouseEvent } from "react";

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
  inset: (0 | "100%" | "auto")[];
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
  private timer: number = 0;

  constructor(props: Props) {
    super(props);
    this.state = { inset: [] };
  }

  private onClick() { }

  private onMouseEnter= (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    clearTimeout(this.timer);
    this.timer = +setTimeout(() => this.setState(() => {
      const haschild = !(Array.isArray(this.props.children) && this.props.children.length === 0);
      const inset: (0 | "100%" | "auto")[] = haschild ? ["auto", "auto", "auto", "auto"] : [];

      if (haschild && this.div.current) {
        const { top, left } = this.div.current.getBoundingClientRect();
        const vert = window.innerHeight / 2 < top ? "top" : "bottom";
        const hori = window.innerWidth / 2 < left ? "left" : "right";

        if (vert === "bottom") {
          inset[0] = this.props.side ? 0 : "100%";
        }
        if (hori === "left") {
          inset[1] = this.props.side ? "100%" : 0;
        }
        if (vert === "top") {
          inset[2] = this.props.side ? 0 : "100%";
        }
        if (hori === "right") {
          inset[3] = this.props.side ? "100%" : 0;
        }
      }

      return { inset };
    }), 200);
  }

  private onMouseLeave= () => {
    clearTimeout(this.timer);
    this.timer = +setTimeout(() => this.setState(() => ({ inset: [] })), 200);
  }

  private renderMenu() {
    if (this.state.inset.length === 0) return null;

    const base = this.props.side ? styles.sidemenu : styles.menu;
    const style = { ...base, ...{ inset: this.state.inset.join(" "), maxWidth: window.innerWidth - 20, minWidth: Math.min(this.props.fit ? 0 : 150, window.innerWidth / 2 - 20) } };
    const direction = this.props.horizontal ? "row" : "column";

    return (
      <FlexComponent color="default" animate="fade-in" direction={direction} position="absolute" overflow="visible" zIndex={20} rounded={[2]} style={style} shadow>
        { this.props.children }
      </FlexComponent>
    );
  }

  render() {
    return (
      <FlexComponent vertical="center" overflow="visible">
        <div className="space" style={styles.wrap} onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave} ref={this.div}>
          <FlexComponent grow={1} vertical="center" color={this.props.color} onClick={this.onClick} active={this.props.active} spacing>{ this.props.label }</FlexComponent>
          { this.renderMenu() }
        </div>
      </FlexComponent>
    );
  }
}
