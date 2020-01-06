import React, { KeyboardEvent, CompositionEvent, ClipboardEvent } from "react";
import { ipcRenderer } from "electron";
import { EventEmitter } from "events";

import { keycode } from "../utils/keycode";

interface Props {
  emit: EventEmitter;
}

interface States {
}

const style = {
  display: "block",
  height: 0,
  padding: 0,
  margin: 0,
  border: "none",
};

export class InputComponent extends React.Component<Props, States> {

  private onKeyDown(e: KeyboardEvent) {
    const input = e.target as HTMLInputElement;
    const code = keycode(e);

    if (input.value && code === "<CR>") return;
    if (["<C-V>", "<D-v>"].indexOf(code) >= 0) return;

    e.stopPropagation();
    e.preventDefault();
    setTimeout(() => {
      if (input.value) {
        this.props.emit.emit("envim:ime", input.value);
      } else {
        code && ipcRenderer.send("envim:input", code);
      }
    });
  }

  private onCompositionEnd(e: CompositionEvent) {
    const input = e.target as HTMLInputElement;

    ipcRenderer.send("envim:input", input.value);
    input.value = "";
  }

  private onPaste(e: ClipboardEvent) {
    e.stopPropagation();
    e.preventDefault();
    ipcRenderer.send("envim:paste", e.clipboardData.getData("text/plain"));
  }

  render() {
    return (
      <input style={style} autoFocus={true}
        onKeyDown={this.onKeyDown.bind(this)}
        onCompositionEnd={this.onCompositionEnd.bind(this)}
        onPaste={this.onPaste.bind(this)}
      />
    );
  }
}
