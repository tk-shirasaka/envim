import React, { KeyboardEvent, CompositionEvent } from "react";

import { Emit } from "../../utils/emit";
import { keycode } from "../../utils/keycode";
import { Highlights } from "../../utils/highlight";
import { row2Y, col2X } from "../../utils/size";

interface Props {
}

interface States {
  top: number;
  left: number;
  width: number;
  color: string;
  background: string;
}

const position: "absolute" = "absolute";
const styles = {
  common: {
    position,
    display: "block",
    border: "none",
    padding: 0,
    margin: 0,
  },
  normal: {
    height: 0,
  },
};

export class InputComponent extends React.Component<Props, States> {

  constructor(props: Props) {
    super(props);

    this.state = { top: 0, left: 0, width: -1, color: "none", background: "none"  };
    Emit.on("envim:focus", this.onFocus.bind(this));
    Emit.on("grid:cursor", this.onCursor.bind(this));
  }

  componentWillUnmount() {
    Emit.clear(["envim:focus", "grid:cursor"]);
  }

  private onFocus() {
    (this.refs.input as HTMLInputElement).focus();
  }

  private onCursor(cursor: { row: number; col: number; hl: number }) {
    const top = row2Y(cursor.row);
    const left = col2X(cursor.col);
    const color = Highlights.color(cursor.hl, "background");
    const background = Highlights.color(cursor.hl, "foreground");
    this.setState({ top, left, color, background });
  }

  private onKeyDown(e: KeyboardEvent) {
    const input = e.target as HTMLInputElement;
    const code = keycode(e);

    if (input.value && code === "<CR>") return;

    e.stopPropagation();
    e.preventDefault();
    setTimeout(() => {
      if (this.state.width >= 0) {
        this.setState({ width: col2X(input.value.length * 2) });
      } else {
        Emit.share("envim:focus");
        code && Emit.send("envim:input", code);
      }
    });
  }

  private onCompositionStart() {
    this.setState({ width: 0 });
  }

  private onCompositionEnd(e: CompositionEvent) {
    const input = e.target as HTMLInputElement;

    input.value && Emit.send("envim:input", input.value);
    input.value = "";
    this.setState({ width: -1 });
  }

  private getStyle() {
    return this.state.width >= 0
      ? { ...styles.common, ...this.state }
      : { ...styles.common, ...styles.normal };
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
