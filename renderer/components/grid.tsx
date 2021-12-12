import React from "react";

interface Props {
  className?: string;

  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;

  direction?: "row" | "column";
  shadow?: boolean;
  space?: number;
  padding?: number[];
  border?: number[];
  rounded?: number[];
  position?: "relative" | "absolute" | "sticky";
  style?: Object;
}

interface States {
}

export class GridComponent extends React.Component<Props, States> {
  private getStyle() {
    const props = this.props;
    return {
        display: "grid",
        overflow: "hidden",
        borderStyle: "solid",
        gridAutoFlow: props.direction || "row",
        gap: props.space || 0,
        boxShadow: props.shadow ? "rgba(0, 0, 0, 0.5) 0 0 4px 2px" : "none",
        padding: props.padding && props.padding.map(px => `${px}px`).join(" ") || 0,
        borderWidth: props.border && props.border.map(px => `${px}px`).join(" ") || 0,
        borderRadius: props.rounded && props.rounded.map(px => `${px}px`).join(" ") || 0,
        position: props.position || "relative",
        ...( props.style || {} )
    };
  }

  render() {
    return (
      <div
        className={this.props.className}
        onClick={this.props.onClick}
        onMouseEnter={this.props.onMouseEnter}
        onMouseLeave={this.props.onMouseLeave}
        style={this.getStyle()}
      >
        { this.props.children }
      </div>
    );
  }
}
