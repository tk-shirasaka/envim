import React, { MouseEvent } from "react";

interface Props {
  className?: string;
  title?: string;

  onClick?: (e: MouseEvent) => void;
  onMouseEnter?: (e: MouseEvent) => void;
  onMouseLeave?: (e: MouseEvent) => void;

  direction?: "row" | "column";
  shadow?: boolean;
  space?: number;
  padding?: number[];
  border?: number[];
  rounded?: number[];
  position?: "relative" | "absolute" | "sticky";
  overflow?: "hidden" | "auto" | "visible";
  wordBreak?: "break-all";
  whiteSpace?: "nowrap" | "pre-wrap" | "pre-line";
  style?: Object;
}

interface States {
}

export class GridComponent extends React.Component<Props, States> {
  private getStyle() {
    const props = this.props;
    return {
        display: "grid",
        borderStyle: "solid",
        gridAutoFlow: props.direction || "row",
        gap: props.space || 0,
        boxShadow: props.shadow ? "rgba(0, 0, 0, 0.5) 0 0 4px 2px" : "none",
        padding: props.padding && props.padding.map(px => `${px}px`).join(" ") || 0,
        borderWidth: props.border && props.border.map(px => `${px}px`).join(" ") || 0,
        borderRadius: props.rounded && props.rounded.map(px => `${px}px`).join(" ") || 0,
        position: props.position || "relative",
        overflow: props.overflow || "hidden",
        wordBreak: this.props.wordBreak || "break-all",
        whiteSpace: this.props.whiteSpace || "nowrap",
        ...( props.style || {} )
    };
  }

  render() {
    return (
      <div
        className={this.props.className}
        title={this.props.title}
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
