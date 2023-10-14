import React, { PropsWithChildren, MouseEvent, WheelEvent } from "react";

interface Props {
  selectable?: boolean;
  animate?: string;
  hover?: boolean;
  color?: string;
  active?: boolean;
  title?: string;

  onClick?: (e: MouseEvent) => void;
  onMouseDown?: (e: MouseEvent) => void;
  onMouseMove?: (e: MouseEvent) => void;
  onMouseUp?: (e: MouseEvent) => void;
  onMouseEnter?: (e: MouseEvent) => void;
  onMouseLeave?: (e: MouseEvent) => void;
  onDragStart?: (e: MouseEvent) => void;
  onDragEnd?: (e: MouseEvent) => void;
  onWheel?: (e: WheelEvent) => void;

  direction?: "row" | "column" | "row-reverse" | "column-reverse";
  shadow?: boolean;
  grow?: number;
  shrink?: number;
  basis?: "auto" | "0";
  vertical?: "stretch" | "start" | "center" | "end";
  horizontal?: "stretch" | "start" | "center" | "end";
  spacing?: boolean;
  inset?: (number | "auto")[];
  margin?: (number | "auto")[];
  padding?: number[];
  border?: number[];
  rounded?: number[];
  position?: "relative" | "absolute" | "sticky";
  overflow?: "hidden" | "auto" | "visible";
  wordBreak?: "break-all";
  whiteSpace?: "nowrap" | "pre-wrap";
  nomouse?: boolean;
  zIndex?: number;
  style?: Object;
}

interface States {
}

export class FlexComponent extends React.Component<PropsWithChildren<Props>, States> {
  private getClassName() {
    const classes: string[] = [];
    const props = this.props;

    props.selectable && classes.push("selectable");
    props.animate && classes.push(`animate ${props.animate}`);
    props.hover && classes.push("contents");
    props.color && classes.push(`color-${props.color}`);
    props.active && classes.push("active");
    props.onClick && classes.push("clickable");

    return classes.join(" ");
  }

  private getStyle() {
    const props = this.props;

    return {
      display: "flex",
      borderStyle: "solid",
      flexDirection: props.direction || "row",
      flexGrow: props.grow || 0,
      flexShrink: props.shrink || 0,
      flexBasis: props.basis || "auto",
      alignItems: props.vertical || "stretch",
      justifyContent: props.horizontal || "stretch",
      boxShadow: props.shadow ? "rgba(0, 0, 0, 0.2) 0 0 2px 2px" : "none",
      padding: (props.spacing ? [0, 4] : props.padding || [0]).map(px => `${px}px`).join(" "),
      inset: (props.inset || ["auto"]).map(px => px === "auto" ? "auto" : `${px}px`).join(" "),
      margin: (props.margin || [0]).map(px => px === "auto" ? "auto" : `${px}px`).join(" "),
      borderWidth: (props.border || [0]).map(px => `${px}px`).join(" "),
      borderRadius: (props.rounded || [0]).map(px => `${px}px`).join(" "),
      position: props.position || "relative",
      overflow: props.overflow || "hidden",
      wordBreak: this.props.wordBreak || "break-all",
      whiteSpace: this.props.whiteSpace || "nowrap",
      ...( props.nomouse ? { pointerEvents: "none" as "none" } : {} ),
      ...( props.zIndex !== undefined ? { zIndex: props.zIndex } : {} ),
      ...( props.style || {} )
    };
  }

  render() {
    return (
      <div
        className={this.getClassName()}
        title={this.props.title}
        onClick={this.props.onClick}
        onMouseDown={this.props.onMouseDown}
        onMouseMove={this.props.onMouseMove}
        onMouseUp={this.props.onMouseUp}
        onMouseEnter={this.props.onMouseEnter}
        onMouseLeave={this.props.onMouseLeave}
        onDragStart={this.props.onDragStart}
        onDragEnd={this.props.onDragEnd}
        onWheel={this.props.onWheel}
        style={this.getStyle()}
        draggable={!!(this.props.onDragStart && this.props.onDragEnd)}
      >
        { this.props.children }
      </div>
    );
  }
}
