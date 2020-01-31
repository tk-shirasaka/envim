import React from "react";
import { ipcRenderer, IpcRendererEvent } from "electron";

import { Emit } from "../../utils/emit";
import { Highlights } from "../../utils/highlight";
import { font } from "../../utils/font";

import { MessageComponent } from "./message";

interface Props {
  width: number;
  height: number;
}

interface States {
  histories: { kind: string, content: string[][] }[];
}

const positionA: "absolute" = "absolute";
const positionS: "sticky" = "sticky";
const textAlign: "right" = "right";
const styles = {
  scope: {
    position: positionA,
    left: 0,
    right: 0,
    bottom: 0,
    animation: "fadeIn .5s ease",
    borderRadius: "4px 4px 0 0",
    boxShadow: "0 0 10px 5px #000",
    overflow: "scroll",
  },
  line: {
    margin: "-4px 0",
  },
  actions: {
    position: positionS,
    top: 0,
    paddingRight: 8,
    textAlign,
    background: "#dee1e6",
  },
  icon: {
    padding: 4,
    cursor: "pointer",
  },
  clear: {
    padding: 4,
    cursor: "pointer",
    color: "#d06666"
  },
  close: {
    padding: 4,
    cursor: "pointer",
    color: "#737577"
  },
};

export class HistoryComponent extends React.Component<Props, States> {

  constructor(props: Props) {
    super(props);

    this.state = { histories: [] };
    Emit.on("envim:focus", this.onClose.bind(this));
    ipcRenderer.on("messages:history", this.onHistory.bind(this));
  }

  componentWillUnmount() {
    Emit.clear("envim:focus");
    ipcRenderer.removeAllListeners("messages:history");
  }

  private onClear() {
    ipcRenderer.send("envim:command", "messages clear");
    this.setState({ histories: [{kind: "", content: [["0", "-- No Messages --"]]}] });
  }

  private onClose() {
    this.setState({ histories: [] });
  }

  private onHistory(_: IpcRendererEvent, histories: States["histories"]) {
    this.setState({ histories });
  }

  private getScopeStyle() {
    const { size } = font.get();
    return {
      ...styles.scope,
      ...this.props,
      background: Highlights.color(0, "background"),
      fontSize: size,
    };
  }

  render() {
    const { size } = font.get();
    return this.state.histories.length === 0 ? null : (
      <div style={this.getScopeStyle()}>
        <div style={styles.actions}>
          <i style={{...styles.clear, fontSize: size + 2}} onClick={this.onClear.bind(this)}>﯊</i>
          <i style={{...styles.close, fontSize: size}} onClick={() => this.onClose()}></i>
        </div>
        {this.state.histories.map(({ kind, content }, i) => (
          <div style={styles.line} key={i}><MessageComponent kind={kind} content={content} scrollable={true} /></div>
        ))}
      </div>
    );
  }
}
