import React, { KeyboardEvent, CompositionEvent } from "react";

import { Emit } from "../../utils/emit";
import { keycode } from "../../utils/keycode";

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

    Emit.on("envim:focus", this.onFocus.bind(this));
  }

  componentWillUnmount() {
    Emit.clear(["envim:focus"]);
  }

  private onFocus() {
    (this.refs.input as HTMLInputElement).focus();
  }

  private onKeyDown(e: KeyboardEvent) {
    const input = e.target as HTMLInputElement;
    const code = keycode(e);

    if (input.value && code === "<CR>") return;

    e.stopPropagation();
    e.preventDefault();
    setTimeout(() => {
      if (input.value) {
        Emit.share("envim:ime", input.value);
      } else {
        Emit.share("envim:focus");
        code && Emit.send("envim:input", code);
      }
    });
  }

  private onCompositionEnd(e: CompositionEvent) {
    const input = e.target as HTMLInputElement;

    Emit.send("envim:input", input.value);
    input.value = "";
  }

  render() {
    return (
      <input style={style} autoFocus={true} ref="input"
        onKeyDown={this.onKeyDown.bind(this)}
        onCompositionEnd={this.onCompositionEnd.bind(this)}
      />
    );
  }
}
