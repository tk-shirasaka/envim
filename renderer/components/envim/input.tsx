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

  constructor(props: Props) {
    super(props);

    this.state = { style: { transform: "", width: col2X(1), zIndex: 0, color: "none", background: "none" }, composit: false, busy: false, shape: "block" };
    Emit.on("envim:focus", this.onFocus.bind(this));
    Emit.on("grid:cursor", this.onCursor.bind(this));
    Emit.on("grid:busy", this.onBusy.bind(this));
    Emit.on("mode:change", this.changeMode.bind(this));
  }

  componentWillUnmount() {
    Emit.clear(["envim:focus", "grid:cursor", "grid:busy", "mode:change"]);
  }

  private onFocus() {
    setTimeout(_ => this.input.current?.focus(), 500);
  }

  private onCursor(cursor: { row: number, col: number, width: number, zIndex: number }) {
    const style = this.state.style;

    style.width = this.getWidth(cursor.width, this.state.shape);
    style.transform = `translate(${col2X(cursor.col)}px, ${row2Y(cursor.row)}px)`;
    style.zIndex = cursor.zIndex;
    this.setState({ style });
  }

  private onBusy(busy: boolean) {
    this.setState({ busy });
  }

  private changeMode(mode: IMode) {
    const style = this.state.style;
    const shape = mode.cursor_shape;

    style.width = this.getWidth(1, shape);
    style.color = Highlights.color(mode.attr_id, "background");
    style.background = Highlights.color(mode.attr_id, "foreground");

    this.setState({ style, shape });
  }

  private getWidth(width: number, shape: "block" | "vertical" | "horizontal") {
    if (this.state.busy) return 0;
    if (width > 1) return col2X(width);
    return shape === "block" ? col2X(width) : 2;
  }

  private onKeyDown(e: KeyboardEvent) {
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

  private onCompositionStart() {
    this.setState({ composit: true });
  }

  private onCompositionEnd(e: CompositionEvent) {
    const input = e.target as HTMLInputElement;
    const style = this.state.style;

    input.value && Emit.send("envim:input", input.value);
    input.value = "";
    style.width = this.getWidth(1, this.state.shape);
    this.setState({ composit: false, style });
  }

  private getStyle() {
    return { ...style, ...this.state.style };
  }

  render() {
    return (
      <input className="animate blink" style={this.getStyle()} autoFocus={true} ref={this.input}
        onKeyDown={this.onKeyDown.bind(this)}
        onCompositionStart={this.onCompositionStart.bind(this)}
        onCompositionEnd={this.onCompositionEnd.bind(this)}
      />
    );
  }
}
