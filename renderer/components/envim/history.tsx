import React from "react";
import { ipcRenderer, IpcRendererEvent } from "electron";

import { Emit } from "../../utils/emit";
import { notificate } from "../../utils/icons";
import { Highlights } from "../../utils/highlight";

interface Props {
  font: { size: number; width: number; height: number; };
}

interface States {
  histories: { kind: string, content: string[][] }[];
}

const position: "absolute" = "absolute";
const overflowX: "hidden" = "hidden";
const overflowY: "scroll" = "scroll";
const styles = {
  scope: {
    position,
    top: "60%",
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.8,
    boxShadow: "0 0 10px 5px #000",
    overflowX,
    overflowY,
  },
  line: {
    display: "flex",
  },
  kind: {
    padding: "1px 8px",
  },
  message: {
    padding: 1,
  },
};

export class HistoryComponent extends React.Component<Props, States> {

  constructor(props: Props) {
    super(props);

    this.state = { histories: [] };
    Emit.on("envim:focus", this.offMessage.bind(this));
    ipcRenderer.on("messages:history", this.onHistory.bind(this));
  }

  componentWillUnmount() {
    Emit.clear("envim:focus");
    ipcRenderer.removeAllListeners("messages:history");
  }

  private onHistory(_: IpcRendererEvent, histories: States["histories"]) {
    this.setState({ histories });
  }

  private offMessage() {
    this.setState({ histories: [] });
  }

  private getScopeStyle() {
    return {
      ...styles.scope,
      background: Highlights.color(0, "background"),
      fontSize: this.props.font.size,
    };
  }

  private getKindStyle(hl: number) {
    return {
      ...styles.kind,
      color: Highlights.color(hl, "background"),
      background: Highlights.color(hl, "foreground"),
    };
  }

  private getMessageStyle(hl: number) {
    return {
      ...styles.message,
      color: Highlights.color(hl, "foreground"),
      background: Highlights.color(hl, "background"),
    };
  }

  render() {
    return this.state.histories.length && (
      <div style={this.getScopeStyle()}>
        {this.state.histories.map(({ kind, content }, i) => (
          content.map(([hl, message], j) => (
            <div style={styles.line} key={`${i}.${j}`}>
              <div style={this.getKindStyle(+hl)}><i style={{fontSize: this.props.font.size}}>{ notificate(kind) }</i></div>
              <div style={this.getMessageStyle(+hl)}>{ message }</div>
            </div>
          ))
        ))}
      </div>
    );
  }
}
