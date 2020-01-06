import React, { KeyboardEvent, CompositionEvent, ClipboardEvent } from "react";
import { ipcRenderer } from "electron";

import { Emit } from "../utils/emit";
import { keycode } from "../utils/keycode";

interface Props {
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

  constructor(props: Props) {
    super(props);

    Emit.on("menu:off", this.onFocus.bind(this));
  }

  componentWillUnmount() {
    Emit.clear("menu:off");
  }

  private onFocus() {
    (this.refs.input as HTMLInputElement).focus();
  }

  private onKeyDown(e: KeyboardEvent) {
    const input = e.target as HTMLInputElement;
    const code = keycode(e);

    if (input.value && code === "<CR>") return;
    if (["<C-V>", "<D-v>"].indexOf(code) >= 0) return;

    e.stopPropagation();
    e.preventDefault();
    setTimeout(() => {
      if (input.value) {
        Emit.send("envim:ime", input.value);
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
      <input style={style} autoFocus={true} ref="input"
        onKeyDown={this.onKeyDown.bind(this)}
        onCompositionEnd={this.onCompositionEnd.bind(this)}
        onPaste={this.onPaste.bind(this)}
      />
    );
  }
}
