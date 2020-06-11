import React from "react";

import { Emit } from "../utils/emit";

import { IconComponent } from "./icon";

interface Props {
  init: boolean;
  side: { width: number; height: number; };
}

interface States {
}

const float: "left" = "left";
const flexDirection: "column" = "column";
const styles = {
  scope: {
    display: "flex",
    overflow: "hidden",
    flexDirection,
    float,
  },
  icon: {
    margin: "auto",
  }
};

export class SidebarComponent extends React.Component<Props, States> {

  private onDetach() {
    Emit.send("envim:detach");
  }

  render() {
    return (
      <div className="color-black dragable" style={{ ...this.props.side, ...styles.scope }}>
        <div className="space" />
        { this.props.init ? (
          <IconComponent color="white-fg" style={styles.icon} font="" raito={2} onClick={this.onDetach.bind(this)} />
        ) : (
          <IconComponent color="gray-fg" style={styles.icon} font="" raito={2} />
        ) }
      </div>
    );
  }
}
