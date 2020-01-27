import React from "react";
import { ipcRenderer, IpcRendererEvent } from "electron";

import { font } from "../../utils/font";

interface Props {
}

interface States {
  items: { word: string, kind: string, menu: string, info: string }[];
  selected: number;
  row: number;
  col: number;
  grid: number;
}

const position: "absolute" = "absolute";
const borderCollapse: "separate" = "separate";
const whiteSpace: "pre" = "pre";
const styles = {
  scope: {
    position,
  },
  table: {
    animation: "fadeIn .5s ease",
    borderSpacing: 0,
    borderCollapse,
    background: "#2f2b2b",
    color: "#ded4d5",
    borderRadius: 4,
    boxShadow: "5px 5px 10px 0px #000",
  },
  tr: {
    opacity: 0.4,
  },
  active: {
    opacity: 1,
  },
  td: {
    padding: 2,
  },
  kind: {
    padding: 2,
    fontFamily: "Ricty Diminished Bold",
    color: "#463c3c",
  },
  info: {
    top: -8,
    position,
    padding: 2,
    marginLeft: 4,
    whiteSpace,
    background: "#2f2b2b",
    borderRadius: 4,
    boxShadow: "5px 5px 10px 0px #000",
  }
};

export class PopupmenuComponent extends React.Component<Props, States> {

  constructor(props: Props) {
    super(props);

    this.state = { items: [], selected: -1, row: 0, col: 0, grid: 0 };
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
    this.setState({ selected });
  }

  private offPopupmenu() {
    this.setState({ items: [] });
  }

  private getScopeStyle() {
    const { size, width, height } = font.get();
    return {
      ...styles.scope,
      top: (this.state.row + 1) * height,
      left: this.state.col * width,
      fontSize: size,
    }
  }

  private getKindStyle(kind: string) {
    if (kind === "") return {};
    switch (kind[0].toUpperCase()) {
      case "A": case "B": case "C": case "D": case "E": return { background: "#ef7777", ...styles.kind };
      case "F": case "G": case "H": case "I": case "J": return { background: "#bbe659", ...styles.kind };
      case "K": case "L": case "M": case "N": case "O": return { background: "#9ff3f0", ...styles.kind };
      case "P": case "Q": case "R": case "S": case "T": return { background: "#d0a7f3", ...styles.kind };
      case "U": case "V": case "W": case "X": case "Y": return { background: "#eff384", ...styles.kind };
      case "Z": default: return { background: "#8cec8b", ...styles.kind };
    }
  }

  render() {
    return this.state.items.length === 0 ? null : (
      <div style={this.getScopeStyle()}>
        <table style={styles.table}>
          <tbody>
            {this.state.items.map(({ word, kind, menu, info }, i) => this.state.selected <= i && (
              <tr style={this.state.selected === i ? styles.active : styles.tr} key={i}>
                <td style={styles.td}>{ word }</td>
                <td style={styles.td}>{ menu }</td>
                <td style={this.getKindStyle(kind)}>{ kind }</td>
                {this.state.selected === i && <td style={styles.info}>{ info }</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
}
