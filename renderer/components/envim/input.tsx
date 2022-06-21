import React, { createRef, RefObject, KeyboardEvent } from "react";

import { IMode } from "../../../common/interface";

import { Emit } from "../../utils/emit";
import { keycode } from "../../utils/keycode";
import { Highlights } from "../../utils/highlight";
import { row2Y, col2X } from "../../utils/size";

import { FlexComponent } from "../flex";

interface Props {
}

interface States {
  style: { pointerEvent: "none"; transform: string; minWidth: number, height: number, zIndex: number; color: string; background: string; };
  composit: boolean;
  value: string;
  busy: boolean;
}

const position: "absolute" = "absolute";
const styles = {
  input: {
    position,
    width: "100%",
    padding: 0,
    margin: 0,
    caretColor: "transparent",
  },
  text: {
    visibility: "hidden",
  },
};

export class InputComponent extends React.Component<Props, States> {
  private input: RefObject<HTMLInputElement> = createRef<HTMLInputElement>();
  private cursor: { x: number, y: number, width: number, hl: string, zIndex: number, shape: "block" | "vertical" | "horizontal" } = { x: 0, y: 0, width: 0, hl: "0", zIndex: 0, shape: "block" };

  constructor(props: Props) {
    super(props);

    this.state = { style: { pointerEvent: "none", transform: "", minWidth: col2X(1), height: row2Y(1), zIndex: 0, color: "", background: "" }, composit: false, value: "", busy: false };
    Emit.on("envim:focus", this.onFocus);
    Emit.on("grid:cursor", this.onCursor);
    Emit.on("grid:busy", this.onBusy);
    Emit.on("mode:change", this.changeMode);
  }

  componentWillUnmount = () => {
    Emit.off("envim:focus", this.onFocus);
    Emit.off("grid:cursor", this.onCursor);
    Emit.off("grid:busy", this.onBusy);
    Emit.off("mode:change", this.changeMode);
  }

  private onFocus = () => {
    const selected = window.getSelection()?.toString();

    selected && navigator.clipboard.writeText(selected);
    this.input.current?.focus();
  }

  private onCursor = (cursor: { x: number, y: number, width: number, hl: string, zIndex: number }) => {
    const style = this.makeStyle(cursor);

    this.setState({ style });
  }

  private onBusy = (busy: boolean) => {
    this.setState({ busy });
  }

  private changeMode = (mode: IMode) => {
    const style = this.makeStyle({ shape: mode.cursor_shape });

    this.setState({ style });
  }

  private makeStyle(cursor: { x?: number, y?: number, width?: number, hl?: string, zIndex?: number, shape?: "block" | "vertical" | "horizontal" }) {
    const pointerEvent: "none" = "none";
    this.cursor = { ...this.cursor, ...cursor };

    return {
      pointerEvent,
      height: row2Y(1),
      minWidth: this.getWidth(this.cursor.width, this.cursor.shape),
      transform: `translate(${col2X(this.cursor.x)}px, ${row2Y(this.cursor.y)}px)`,
      zIndex: this.cursor.zIndex,
      color: Highlights.color(this.cursor.hl, "foreground", { reverse: true, normal: true }),
      background: Highlights.color(this.cursor.hl, "background", { reverse: true, normal: true }),
    };
  }

  private getWidth(width: number, shape: "block" | "vertical" | "horizontal") {
    if (this.state.busy) return 0;
    return shape === "block" ? col2X(width) : 2;
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (this.state.composit) return;
    const code = keycode(e);

    e.stopPropagation();
    e.preventDefault();

    code && Emit.send("envim:input", code);
  }

  private onKeyUp = () => {
    if (this.state.composit === false) return;

    this.setState({ value: this.input.current?.value || "" });
  }

  private onCompositionStart = () => {
    this.setState({ composit: true });
  }

  private onCompositionEnd = () => {
    if (this.input.current) {
      Emit.send("envim:input", this.input.current.value);
      this.input.current.value = "";
    }
    this.setState({ composit: false, value: "" });
  }

  render() {
    return (
      <FlexComponent animate={this.state.composit ? "" : "blink"} style={this.state.style} nomouse>
        <input type="text" style={styles.input} ref={this.input} autoFocus
          onKeyDown={this.onKeyDown}
          onKeyUp={this.onKeyUp}
          onCompositionStart={this.onCompositionStart}
          onCompositionEnd={this.onCompositionEnd}
          />
        <FlexComponent style={styles.text}>{ this.state.value }</FlexComponent>
      </FlexComponent>
    );
  }
}
