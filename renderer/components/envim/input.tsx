import React, { useEffect, useState, useRef, RefObject, KeyboardEvent } from "react";

import { useEditor } from "../../context/editor";

import { Emit } from "../../utils/emit";
import { keycode } from "../../utils/keycode";
import { row2Y, col2X } from "../../utils/size";

import { FlexComponent } from "../flex";

interface States {
  cursor: { x: number, y: number, width: number, zIndex: number, shape: "block" | "vertical" | "horizontal" };
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

export function InputComponent () {
  const { busy, mode } = useEditor();
  const [state, setState] = useState<States>({ cursor: { x: 0, y: 0, width: 0, zIndex: 0, shape: "block" }, value: "", busy, focus: true, focusable: true });
  const input: RefObject<HTMLInputElement | null> = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Emit.on("envim:focus", onFocus);
    Emit.on("envim:focusable", onFocusable);
    Emit.on("grid:cursor", onCursor);

    return () => {
      Emit.off("envim:focus", onFocus);
      Emit.off("grid:cursor", onCursor);
    };
  }, [])

  function onFocus () {
    setState(state => {
      if (state.focusable) {
        const selected = window.getSelection()?.toString();

        selected && navigator.clipboard.writeText(selected);
        input.current?.focus();
      }

      return { ...state, focus: state.focusable };
    });
  }

  function onFocusable (focusable: boolean) {
    focusable ? input.current?.focus() : input.current?.blur();;
    setState(state => ({ ...state, focusable }));
  }

  function onCursor (cursor: { x: number, y: number, width: number, hl: string, zIndex: number }) {
    setState(state => ({ ...state, cursor: { ...state.cursor, ...cursor }}));
  }

  useEffect(() => {
    setState(state => ({ ...state, busy }));
  }, [busy]);

  useEffect(() => {
    if (mode) {
      setState(state => ({ ...state, cursor: { ...state.cursor, shape: mode.cursor_shape }}));
      mode.short_name === "c" && input.current?.focus();
    }
  }, [mode]);

  function makeStyle() {
    const pointerEvent: "none" = "none";
    const cursor = state.cursor
    const multibyte = (encodeURIComponent(state.value).replace(/%../g, "x").length - state.value.length) / 2;
    const offset = Math.max(col2X(cursor.x + state.value.length + multibyte + 1) - document.body.clientWidth, 0);

    return {
      pointerEvent,
      minWidth: getWidth(),
      height: row2Y(1),
      transform: `translate(${col2X(cursor.x) - offset}px, ${row2Y(cursor.y)}px)`,
      zIndex: cursor.zIndex,
      backdropFilter: "invert(1)",
    };
  }

  function getWidth() {
    if (state.busy || !state.focus) return 0;
    return state.cursor.shape === "block" ? col2X(state.cursor.width) : 2;
  }

  function toggleFocus (focus: boolean) {
    setState(state => ({ ...state, focus }));
    focus && Emit.share("envim:focused")
  }

  function onKeyDown (e: KeyboardEvent) {
    if (e.nativeEvent.isComposing) return;
    const code = keycode(e);

    e.stopPropagation();
    e.preventDefault();

    code && Emit.send("envim:input", code);
  }

  function onKeyUp (e: KeyboardEvent) {
    if (!e.nativeEvent.isComposing && input.current?.value) {
      Emit.send("envim:input", input.current.value);
      input.current.value = "";
    }

    (input.current?.value || state.value) && setState(state => ({ ...state, value: input.current?.value || "" }));
  }

  return (
    <FlexComponent animate="fade-in" style={makeStyle()} shadow={!state.busy && state.focus} nomouse>
      <input type="text" style={styles.input} ref={input} tabIndex={-1} autoFocus
        onFocus={() => toggleFocus(true)}
        onBlur={() => toggleFocus(false)}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
      />
      <FlexComponent style={styles.text}>{ state.value }</FlexComponent>
    </FlexComponent>
  );
}
