import React from "react";

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
};

export class HistoryComponent extends React.Component<Props, States> {

  constructor(props: Props) {
    super(props);

    this.state = { filter: [], histories: [] };
    Emit.on("envim:focus", this.onClose.bind(this));
    Emit.on("messages:history", this.onHistory.bind(this));
  }

  componentWillUnmount() {
    Emit.clear(["envim:focus", "messages:history"]);
  }

  private onClear() {
    Emit.send("envim:command", "messages clear");
    this.setState({ histories: [{kind: "", content: [["0", "-- No Messages --"]]}] });
  }

  private onFilter(kinds: string[]) {
    this.setState({ filter: this.state.filter === kinds ? [] : kinds });
  }

  private onClose() {
    this.setState({ histories: [] });
  }

  private onHistory(histories: States["histories"]) {
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

  private getIconStyle() {
    const { size } = font.get();
    return {
      ...styles.icon,
      fontSize: size + 8,
    };
  }

  render() {
    return this.state.histories.length === 0 ? null : (
      <div style={this.getScopeStyle()}>
        <div style={styles.actions}>
          <i className="color-red-fg clickable" style={this.getIconStyle()} onClick={this.onClear.bind(this)}>ﰸ</i>
          {notificates.filter(icon => icon.filter).map((icon, i) => (
            <i className={`color-${icon.color}-fg ${icon.kinds === this.state.filter ? "active" : "clickable"}`} style={this.getIconStyle()} onClick={() => this.onFilter(icon.kinds)} key={i}>{ icon.font }</i>)
          )}
          <i className="color-black-fg clickable" style={this.getIconStyle()} onClick={() => this.onClose()}></i>
        </div>
        {this.state.histories.map(({ kind, content }, i) => (
          (this.state.filter.length && this.state.filter.indexOf(kind) < 0) || <div key={i}><MessageComponent kind={kind} content={content} /></div>
        ))}
      </div>
    );
  }
}
