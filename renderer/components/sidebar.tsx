import React from "react";

import { Emit } from "../utils/emit";

import { IconComponent } from "./icon";

interface Props {
  init: boolean;
  side: { width: number; height: number; };
}

interface States {
}

const flexDirection: "column" = "column";
const styles = {
  scope: {
    display: "flex",
    overflow: "hidden",
    flexDirection,
  },
  icon: {
    paddingTop: 4,
    textAlign: "center",
    WebkitAppRegion: "no-drag",
  }
};

export class SidebarComponent extends React.Component<Props, States> {

  private onQuit() {
    Emit.send("app:quit");
  }

  private onDetach() {
    Emit.send("envim:detach");
  }

  render() {
    return (
      <div className="color-black dragable" style={{ ...this.props.side, ...styles.scope }}>
        <IconComponent color="red-fg" style={styles.icon} font="" onClick={this.onQuit.bind(this)} />
        <div className="space" />
        { this.props.init ? (
          <IconComponent color="white-fg" style={styles.icon} font="" onClick={this.onDetach.bind(this)} />
        ) : (
          <IconComponent color="gray-fg" style={styles.icon} font="" />
        ) }
      </div>
    );
  }
}
