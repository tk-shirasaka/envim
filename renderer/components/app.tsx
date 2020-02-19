import React from "react";

import { Emit } from "../utils/emit";
import { SettingComponent } from "./setting";
import { EnvimComponent } from "./envim";

interface Props {
}

interface States {
  init: boolean;
}

export class AppComponent extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);
    this.state = { init: false };

    Emit.on("app:start", this.onStart.bind(this));
    Emit.on("app:stop", this.onStop.bind(this));
  }

  private onStart() {
    this.setState({ init: true });
  }

  private onStop() {
    this.setState({ init: false });
  }

  render() {
    return this.state.init
      ? <EnvimComponent />
      : <SettingComponent />;
  }
}
