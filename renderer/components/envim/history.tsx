import React from "react";
import { ipcRenderer, IpcRendererEvent } from "electron";

import { Emit } from "../../utils/emit";
import { notificate } from "../../utils/icons";
import { Highlights } from "../../utils/highlight";
import { font } from "../../utils/font";

interface Props {
  width: number;
  height: number;
}

interface States {
  histories: { kind: string, content: string[][] }[];
}

const positionA: "absolute" = "absolute";
const positionS: "sticky" = "sticky";
const whiteSpace: "pre-wrap" = "pre-wrap";
const overflowX: "hidden" = "hidden";
const overflowY: "scroll" = "scroll";
const styles = {
  scope: {
    position: positionA,
    left: 0,
    right: 0,
    bottom: 0,
    animation: "fadeIn .5s ease",
    borderRadius: "4px 4px 0 0",
    boxShadow: "0 0 10px 5px #000",
    whiteSpace,
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
    padding: "1px 4px",
  },
  clearLine: {
    position: positionS,
    top: 0,
    paddingLeft: 4,
    cursor: "pointer",
  },
  clearIcon: {
    padding: 4,
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

  private onClick() {
    ipcRenderer.send("envim:command", "messages clear");
    this.setState({ histories: [{kind: "", content: [["0", "-- No Messages --"]]}] });
  }

  private onHistory(_: IpcRendererEvent, histories: States["histories"]) {
    this.setState({ histories });
  }

  private offMessage() {
    this.setState({ histories: [] });
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

  private getAnyStyle(hl: number, type: "kind" | "message" | "clearLine", reverse: boolean) {
    return {
      ...styles[type],
      color: Highlights.color(hl, reverse ? "background" : "foreground"),
      background: Highlights.color(hl, reverse ? "foreground" : "background"),
    };
  }

  render() {
    const { size } = font.get();
    return this.state.histories.length === 0 ? null : (
      <div style={this.getScopeStyle()}>
        <div style={this.getAnyStyle(0, "clearLine", false)}><i style={{...styles.clearIcon, fontSize: size + 2}} onClick={this.onClick.bind(this)}>﯊</i></div>
        {this.state.histories.map(({ kind, content }, i) => (
          content.map(([hl, message], j) => (
            <div style={styles.line} key={`${i}.${j}`}>
              <div style={this.getAnyStyle(+hl, "kind", true)}><i style={{fontSize: size}}>{ notificate(kind) }</i></div>
              <div style={this.getAnyStyle(+hl, "message", false)}>{ message }</div>
            </div>
          ))
        ))}
      </div>
    );
  }
}
