import React, { createRef, RefObject, KeyboardEvent } from "react";

import { IMode } from "../../../common/interface";

import { Emit } from "../../utils/emit";
import { keycode } from "../../utils/keycode";
import { row2Y, col2X } from "../../utils/size";

import { FlexComponent } from "../flex";

interface Props {
}

interface States {
  cursor: { x: number, y: number, width: number, zIndex: number, shape: "block" | "vertical" | "horizontal" };
  composit: boolean;
  value: string;
  busy: boolean;
  focus: boolean;
  focusable: boolean;
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

  constructor(props: Props) {
    super(props);

    this.state = { cursor: { x: 0, y: 0, width: 0, zIndex: 0, shape: "block" }, composit: false, value: "", busy: false, focus: true, focusable: true };
    Emit.on("envim:focus", this.onFocus);
    Emit.on("envim:focusable", this.onFocusable);
    Emit.on("grid:cursor", this.onCursor);
    Emit.on("grid:busy", this.onBusy);
    Emit.on("mode:change", this.changeMode);
  }

  componentWillUnmount = () => {
    Emit.off("envim:focus", this.onFocus);
    Emit.off("envim:focusable", this.onFocusable);
    Emit.off("grid:cursor", this.onCursor);
    Emit.off("grid:busy", this.onBusy);
    Emit.off("mode:change", this.changeMode);
  }

  private onFocus = () => {
    if (!this.state.focusable) return;

    const selected = window.getSelection()?.toString();

    selected && navigator.clipboard.writeText(selected);
    this.input.current?.focus();
  }

  private onFocusable = (focusable: boolean) => {
    this.setState(() => ({ focusable }));
    focusable && this.input.current?.focus();
  }

  private onCursor = (cursor: { x: number, y: number, width: number, hl: string, zIndex: number }) => {
    this.setState(state => ({ cursor: { ...state.cursor, ...cursor }}));
  }

  private onBusy = (busy: boolean) => {
    this.setState(() => ({ busy }));
  }

  private changeMode = (mode: IMode) => {
    this.setState(state => ({ cursor: { ...state.cursor, shape: mode.cursor_shape }}));
    mode.short_name === "c" && this.input.current?.focus();
  }

  private makeStyle() {
    const pointerEvent: "none" = "none";
    const cursor = this.state.cursor

    return {
      pointerEvent,
      minWidth: this.getWidth(),
      height: row2Y(1),
      transform: `translate(${col2X(cursor.x)}px, ${row2Y(cursor.y)}px)`,
      zIndex: cursor.zIndex,
      backdropFilter: "invert(1)",
    };
  }

  private getWidth() {
    if (this.state.busy || !this.state.focus) return 0;
    return this.state.cursor.shape === "block" ? col2X(this.state.cursor.width) : 2;
  }

  private toggleFocus = (focus: boolean) => {
    this.setState(() => ({ focus }));
    focus && Emit.share("envim:focused")
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

    this.setState(() => ({ value: this.input.current?.value || "" }));
  }

  private onCompositionStart = () => {
    this.setState(() => ({ composit: true }));
  }

  private onCompositionEnd = () => {
    if (this.input.current) {
      Emit.send("envim:input", this.input.current.value);
      this.input.current.value = "";
    }
    this.setState(() => ({ composit: false, value: "" }));
  }

  render() {
    return (
      <FlexComponent animate="fade-in" style={this.makeStyle()} shadow={!this.state.busy && this.state.focus} nomouse>
        <input type="text" style={styles.input} ref={this.input} tabIndex={-1} autoFocus
          onFocus={() => this.toggleFocus(true)}
          onBlur={() => this.toggleFocus(false)}
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
