import React from "react";
import { ipcRenderer, IpcRendererEvent } from "electron";

import { Emit } from "../../utils/emit";
import { Highlights } from "../../utils/highlight";
import { notificates } from "../../utils/icons";
import { font } from "../../utils/font";

import { MessageComponent } from "./message";

interface Props {
  width: number;
  height: number;
}

interface States {
  filter: string[],
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
    overflow: "auto",
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
    padding: "2px 4px",
  },
  clear: {
    padding: "2px 4px",
    color: "#d06666"
  },
};

export class HistoryComponent extends React.Component<Props, States> {

  constructor(props: Props) {
    super(props);

    this.state = { filter: [], histories: [] };
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

  private onFilter(kinds: string[]) {
    this.setState({ filter: this.state.filter === kinds ? [] : kinds });
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

  private getIconStyle(icon: { font: string; color: string; kinds: string[] }) {
    const { size } = font.get();
    const opacity = icon.kinds === this.state.filter ? 1 : 0.4;
    return {
      ...styles.icon,
      opacity,
      fontSize: size + 8,
    };
  }

  render() {
    const { size } = font.get();
    return this.state.histories.length === 0 ? null : (
      <div style={this.getScopeStyle()}>
        <div style={styles.actions}>
          <i className="color-red-fg clickable" style={{...styles.clear, fontSize: size + 8}} onClick={this.onClear.bind(this)}>ﰸ</i>
          {notificates.map((icon, i) => <i className={`color-${icon.color}-fg clickable`} style={this.getIconStyle(icon)} onClick={() => this.onFilter(icon.kinds)} key={i}>{ icon.font }</i>)}
          <i className="color-black-fg clickable" style={{...styles.icon, fontSize: size + 8}} onClick={() => this.onClose()}></i>
        </div>
        {this.state.histories.map(({ kind, content }, i) => (
          (this.state.filter.length && this.state.filter.indexOf(kind) < 0) || <div style={styles.line} key={i}><MessageComponent kind={kind} content={content} /></div>
        ))}
      </div>
    );
  }
}
