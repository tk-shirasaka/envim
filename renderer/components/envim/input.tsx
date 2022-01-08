import React, { createRef, RefObject, KeyboardEvent, CompositionEvent } from "react";

import { IMode } from "../../../common/interface";

import { Emit } from "../../utils/emit";
import { keycode } from "../../utils/keycode";
import { Highlights } from "../../utils/highlight";
import { row2Y, col2X } from "../../utils/size";

interface Props {
}

interface States {
  style: { transform: string; width: number, zIndex: number; color: string; background: string; };
  composit: boolean;
  busy: boolean;
  shape: "block" | "vertical" | "horizontal";
}

const position: "absolute" = "absolute";
const pointerEvents: "none" = "none";
const style = {
  position,
  display: "block",
  border: "none",
  padding: 0,
  margin: 0,
  caretColor: "transparent",
  pointerEvents,
};

export class InputComponent extends React.Component<Props, States> {
  private input: RefObject<HTMLInputElement> = createRef<HTMLInputElement>();
  private queue?: { x: number, y: number, width: number, hl: string, zIndex: number };
  private transition: boolean = false;

  constructor(props: Props) {
    super(props);

    this.state = { style: { transform: "", width: col2X(1), zIndex: 0, color: "none", background: "none" }, composit: false, busy: false, shape: "block" };
    Emit.on("envim:focus", this.onFocus);
    Emit.on("grid:cursor", this.onCursor);
    Emit.on("grid:busy", this.onBusy);
    Emit.on("mode:change", this.changeMode);
  }

  componentWillUnmount() {
    Emit.clear(["envim:focus", "grid:cursor", "grid:busy", "mode:change"]);
  }

  private onFocus = () => {
    const selected = window.getSelection()?.toString();

    selected && navigator.clipboard.writeText(selected);
    this.input.current?.focus();
  }

  private onCursor = (cursor: { x: number, y: number, width: number, hl: string, zIndex: number }) => {
    if (this.transition) {
      this.queue = cursor;
    } else {
      const style = this.state.style;

      style.width = this.getWidth(cursor.width, this.state.shape);
      style.transform = `translate(${col2X(cursor.x)}px, ${row2Y(cursor.y)}px)`;
      style.zIndex = cursor.zIndex;
      style.color = Highlights.color(cursor.hl, "foreground", { reverse: true, normal: true });
      style.background = Highlights.color(cursor.hl, "background", { reverse: true, normal: true });

      delete(this.queue);
      this.setState({ style });
    }
  }

  private onBusy = (busy: boolean) => {
    this.setState({ busy });
  }

  private changeMode = (mode: IMode) => {
    const style = this.state.style;
    const shape = mode.cursor_shape;

    style.width = this.getWidth(1, shape);

    this.setState({ style, shape });
  }

  private getWidth(width: number, shape: "block" | "vertical" | "horizontal") {
    if (this.state.busy) return 0;
    if (width > 1) return col2X(width);
    return shape === "block" ? col2X(width) : 2;
  }

  private onKeyDown = (e: KeyboardEvent) => {
    const input = e.target as HTMLInputElement;
    const code = keycode(e);

    if (input.value && code === "<CR>") return;

    e.stopPropagation();
    e.preventDefault();

    if (this.state.composit) {
      const style = this.state.style;
      style.width = this.getWidth(input.value.length * 2, this.state.shape);
      this.setState({ style });
    } else {
      code && Emit.send("envim:input", code);
    }
  }

  private onCompositionStart = () => {
    this.setState({ composit: true });
  }

  private onCompositionEnd = (e: CompositionEvent) => {
    const input = e.target as HTMLInputElement;
    const style = this.state.style;

    input.value && Emit.send("envim:input", input.value);
    input.value = "";
    style.width = this.getWidth(1, this.state.shape);
    this.setState({ composit: false, style });
  }

  private onTransitionEnd = () => {
    this.transition = false;

    this.queue && this.onCursor(this.queue);
  }

  private getStyle() {
    return this.state.composit
      ? { ...style, ...this.state.style, animationDuration: "0s" }
      : { ...style, ...this.state.style };
  }

  render() {
    return (
      <input className="animate blink" style={this.getStyle()} autoFocus={true} ref={this.input}
        onKeyDown={this.onKeyDown}
        onCompositionStart={this.onCompositionStart}
        onCompositionEnd={this.onCompositionEnd}
        onTransitionEnd={this.onTransitionEnd}
      />
    );
  }
}
