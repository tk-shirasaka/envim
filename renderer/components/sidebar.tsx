import React from "react";

import { Emit } from "../utils/emit";

import { IconComponent } from "./icon";

interface Props {
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
  }
};

export class SidebarComponent extends React.Component<Props, States> {

  private onQuit() {
    Emit.send("app:quit");
  }

  render() {
    return (
      <div className="color-black" style={{ ...this.props.side, ...styles.scope }}>
        <IconComponent color="red-fg" style={styles.icon} font="" onClick={this.onQuit.bind(this)} />
        <div className="space dragable" />
      </div>
    );
  }
}
