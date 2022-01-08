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
  shape: "block" | "vertical" | "horizontal";
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
  private queue?: { x: number, y: number, width: number, hl: string, zIndex: number };
  private transition: boolean = false;

  constructor(props: Props) {
    super(props);

    this.state = { style: { pointerEvent: "none", transform: "", minWidth: col2X(1), height: row2Y(1), zIndex: 0, color: "", background: "" }, composit: false, value: "", busy: false, shape: "block" };
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
      const style = { ...this.state.style };

      style.minWidth = this.getWidth(cursor.width, this.state.shape);
      style.transform = `translate(${col2X(cursor.x)}px, ${row2Y(cursor.y)}px)`;
      style.zIndex = cursor.zIndex;
      style.color = Highlights.color(cursor.hl, "foreground", { reverse: true, normal: true });
      style.background = Highlights.color(cursor.hl, "background", { reverse: true, normal: true });

      delete(this.queue);
      this.transition = this.state.style.minWidth !== style.minWidth || this.state.style.transform !== style.transform;
      this.setState({ style });
    }
  }

  private onBusy = (busy: boolean) => {
    this.setState({ busy });
  }

  private changeMode = (mode: IMode) => {
    const style = this.state.style;
    const shape = mode.cursor_shape;

    style.minWidth = this.getWidth(1, shape);

    this.setState({ style, shape });
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

  private onTransitionEnd = () => {
    this.transition = false;

    this.queue && this.onCursor(this.queue);
  }

  render() {
    return (
      <FlexComponent animate={this.state.composit ? "" : "blink"} style={this.state.style} onTransitionEnd={this.onTransitionEnd}>
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
