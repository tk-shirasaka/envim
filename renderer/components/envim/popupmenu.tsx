import React from "react";
import { ipcRenderer, IpcRendererEvent } from "electron";

import { Emit } from "../../utils/emit";
import { font } from "../../utils/font";

interface Props {
}

interface States {
  items: { word: string, kind: string, menu: string, info: string }[];
  start: number;
  selected: number;
  row: number;
  col: number;
  grid: number;
}

const position: "absolute" = "absolute";
const whiteSpace: "pre" = "pre";
const styles = {
  scope: {
    position,
    display: "grid",
    animation: "fadeIn .5s ease",
    borderRadius: 4,
    boxShadow: "5px 5px 10px 0px #000",
    background: "#2e3138",
    color: "#737a7d",
    cursor: "pointer",
  },
  line: {
    display: "contents",
  },
  active: {
    color: "#ded4d5",
    background: "#46484c",
  },
  column: {
    padding: 2,
  },
  info: {
    position,
    marginLeft: 4,
    whiteSpace,
    borderRadius: 4,
    boxShadow: "5px 5px 10px 0px #000",
  }
};

export class PopupmenuComponent extends React.Component<Props, States> {

  constructor(props: Props) {
    super(props);

    this.state = { items: [], start: 0, selected: -1, row: 0, col: 0, grid: 0 };
    ipcRenderer.on("popupmenu:show", this.onPopupmenu.bind(this));
    ipcRenderer.on("popupmenu:select", this.onSelect.bind(this));
    ipcRenderer.on("popupmenu:hide", this.offPopupmenu.bind(this));
  }

  componentWillUnmount() {
    ipcRenderer.removeAllListeners("popupmenu:show");
    ipcRenderer.removeAllListeners("popupmenu:select");
    ipcRenderer.removeAllListeners("popupmenu:hide");
  }

  private onPopupmenu(_: IpcRendererEvent, state: States) {
    this.setState(state);
  }

  private onSelect(_: IpcRendererEvent, selected: number) {
    const start = this.state.start <= selected && selected <= this.state.start + 4
      ? this.state.start
      : Math.max(0, Math.min(this.state.items.length, this.state.start - this.state.selected + selected));

    this.setState({ selected, start });
  }

  private offPopupmenu() {
    this.setState({ items: [] });
  }

  private onItem(i: number) {
    const num = i - this.state.selected;
    const cmd = num < 0 ? "<C-p>" : "<C-n>";

    Emit.send("envim:focus");
    ipcRenderer.send("envim:input", cmd.repeat(Math.abs(num)));
  }

  private getScopeStyle() {
    const { size, width, height } = font.get();
    return {
      ...styles.scope,
      top: (this.state.row + 1) * height,
      left: this.state.col * width,
      fontSize: size,
    };
  }

  private getColumnStyle(i: number, gridColumn: number, style: object = {}) {
    return {
      gridColumn,
      ...styles.column,
      ...(this.state.selected === i ? styles.active : {}),
      ...style,
    };
  }

  private getKindStyle(kind: string) {
    if (kind === "") return {};
    switch (kind[0].toUpperCase()) {
      case "A": case "B": case "C": case "D": case "E": return { color: "#f58e8e" };
      case "F": case "G": case "H": case "I": case "J": return { color: "#cde88f" };
      case "K": case "L": case "M": case "N": case "O": return { color: "#bbefed" };
      case "P": case "Q": case "R": case "S": case "T": return { color: "#d0a7f3" };
      case "U": case "V": case "W": case "X": case "Y": return { color: "#eff384" };
      case "Z": default: return { color: "#8cec8b" };
    }
  }

  render() {
    const { start } = this.state;
    const end = Math.min(this.state.items.length, start + 5);

    return this.state.items.length === 0 ? null : (
      <div style={this.getScopeStyle()}>
        {this.state.items.slice(start, end).map(({ word, kind, menu, info }, i) => (
          <div style={styles.line} onClick={() => this.onItem(i + start)} key={i}>
            <div style={this.getColumnStyle(i + start, 1)}>{ word }</div>
            <div style={this.getColumnStyle(i + start, 2)}>{ menu }</div>
            <div style={this.getColumnStyle(i + start, 3, this.getKindStyle(kind))}>{ kind }</div>
            {this.state.selected === i + start && <div style={this.getColumnStyle(i + start, 4, styles.info)}>{ info }</div>}
          </div>
        ))}
      </div>
    )
  }
}
