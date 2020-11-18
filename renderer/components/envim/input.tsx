import React, { KeyboardEvent, CompositionEvent } from "react";

import { Emit } from "../../utils/emit";
import { keycode } from "../../utils/keycode";
import { Highlights } from "../../utils/highlight";
import { row2Y, col2X } from "../../utils/size";

interface Props {
}

interface States {
  style: { top: number; left: number; width: number; color: string; background: string; };
  composit: boolean;
  busy: boolean;
}

const position: "absolute" = "absolute";
const pointerEvents: "none" = "none";
const style = {
  zIndex: 10,
  position,
  display: "block",
  border: "none",
  padding: 0,
  margin: 0,
  opacity: 0.6,
  caretColor: "transparent",
  pointerEvents,
};

export class InputComponent extends React.Component<Props, States> {

  constructor(props: Props) {
    super(props);

    this.state = { style: { top: 0, left: 0, width: col2X(1), color: "none", background: "none" }, composit: false, busy: false };
    Emit.on("envim:focus", this.onFocus.bind(this));
    Emit.on("grid:cursor", this.onCursor.bind(this));
    Emit.on("grid:busy", this.onBusy.bind(this));
  }

  componentWillUnmount() {
    Emit.clear(["envim:focus", "grid:cursor", "grid:busy"]);
  }

  private onFocus() {
    (this.refs.input as HTMLInputElement).focus();
  }

  private onCursor(cursor: { row: number, col: number, width: number, hl: number }) {
    const style = this.state.style;
    style.width = this.state.busy ? 0 : col2X(cursor.width);
    style.top = row2Y(cursor.row);
    style.left = col2X(cursor.col);
    style.color = Highlights.color(cursor.hl, "background");
    style.background = Highlights.color(cursor.hl, "foreground");
    this.setState({ style });
  }

  private onBusy(busy: boolean) {
    this.setState({ busy });
  }

  private onKeyDown(e: KeyboardEvent) {
    const input = e.target as HTMLInputElement;
    const code = keycode(e);

    if (input.value && code === "<CR>") return;

    e.stopPropagation();
    e.preventDefault();

    if (this.state.composit) {
      const style = this.state.style;
      style.width = this.state.busy ? 0 : col2X(input.value.length * 2);
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
    style.width = this.state.busy ? 0 : col2X(1);
    this.setState({ composit: false, style });
  }

  private getStyle() {
    return { ...style, ...this.state.style };
  }

  render() {
    return (
      <input style={this.getStyle()} autoFocus={true} ref="input"
        onKeyDown={this.onKeyDown.bind(this)}
        onCompositionStart={this.onCompositionStart.bind(this)}
        onCompositionEnd={this.onCompositionEnd.bind(this)}
      />
    );
  }
}
