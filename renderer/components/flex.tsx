import React from "react";

interface Props {
  className?: string;

  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;

  direction?: "row" | "column";
  shadow?: boolean;
  grow?: number;
  shrink?: number;
  vertical?: "stretch" | "start" | "center" | "end";
  horizontal?: "stretch" | "start" | "center" | "end";
  margin?: number[];
  padding?: number[];
  border?: number[];
  rounded?: number[];
  position?: "relative" | "absolute" | "sticky";
  overflow?: "hidden" | "auto" | "visible";
  style?: Object;
}

interface States {
}

export class FlexComponent extends React.Component<Props, States> {
  private getStyle() {
    const props = this.props;
    return {
        display: "flex",
        borderStyle: "solid",
        flexDirection: props.direction || "row",
        flexGrow: props.grow || 0,
        flexShrink: props.shrink || 0,
        alignItems: props.vertical || "stretch",
        justifyContent: props.horizontal || "stretch",
        boxShadow: props.shadow ? "rgba(0, 0, 0, 0.5) 0 0 4px 2px" : "none",
        padding: props.padding && props.padding.map(px => `${px}px`).join(" ") || 0,
        margin: props.margin && props.margin.map(px => `${px}px`).join(" ") || 0,
        borderWidth: props.border && props.border.map(px => `${px}px`).join(" ") || 0,
        borderRadius: props.rounded && props.rounded.map(px => `${px}px`).join(" ") || 0,
        position: props.position || "relative",
        overflow: props.overflow || "hidden",
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
