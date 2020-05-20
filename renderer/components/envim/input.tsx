import React, { KeyboardEvent, CompositionEvent } from "react";

import { Emit } from "../../utils/emit";
import { keycode } from "../../utils/keycode";
import { Setting } from "../../utils/setting";
import { Highlights } from "../../utils/highlight";

interface Props {
}

interface States {
  cursor: { row: number, col: number, hl: number };
  composition: number;
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

    this.state = { cursor: { row: 0, col: 0, hl: 0 }, composition: -1 };
    Emit.on("envim:focus", this.onFocus.bind(this));
    Emit.on("grid:cursor", this.onCursor.bind(this));
  }

  componentWillUnmount() {
    Emit.clear(["envim:focus", "grid:cursor"]);
  }

  private onFocus() {
    (this.refs.input as HTMLInputElement).focus();
  }

  private onCursor(cursor: States["cursor"]) {
    this.setState({ cursor });
  }

  private onKeyDown(e: KeyboardEvent) {
    const input = e.target as HTMLInputElement;
    const code = keycode(e);

    if (input.value && code === "<CR>") return;

    e.stopPropagation();
    e.preventDefault();
    setTimeout(() => {
      if (this.state.composition >= 0) {
        this.setState({ composition: input.value.length });
      } else {
        Emit.share("envim:focus");
        code && Emit.send("envim:input", code);
      }
    });
  }

  private onCompositionStart() {
    this.setState({ composition: 0 });
  }

  private onCompositionEnd(e: CompositionEvent) {
    const input = e.target as HTMLInputElement;

    Emit.send("envim:input", input.value);
    input.value = "";
    this.setState({ composition: -1 });
  }

  private getStyle() {
    if (this.state.composition >= 0) {
      const top = this.state.cursor.row * Setting.font.height;
      const left = this.state.cursor.col * Setting.font.width;
      const width = this.state.composition * Setting.font.width * 2;
      const color = Highlights.color(this.state.cursor.hl, "background");
      const background = Highlights.color(this.state.cursor.hl, "foreground");
      return { ...styles.common, top, left, width, color, background };
    } else {
      return { ...styles.common, ...styles.normal };
    }
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
