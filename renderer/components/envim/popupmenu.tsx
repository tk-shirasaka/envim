import React from "react";

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
}

const position: "absolute" = "absolute";
const whiteSpace: "pre" = "pre";
const styles = {
  scope: {
    position,
    animation: "fadeIn .5s ease",
  },
  popup: {
    overflow: "hidden",
    borderRadius: 4,
    boxShadow: "5px 5px 10px 0px #000",
  },
  line: {
    display: "flex",
    justifyContent: "space-between",
  },
  column: {
    padding: "1px 4px 0",
  },
  info: {
    position,
    margin: 4,
    padding: 4,
    whiteSpace,
    borderRadius: 4,
    boxShadow: "5px 5px 10px 0px #000",
  }
};

export class PopupmenuComponent extends React.Component<Props, States> {

  constructor(props: Props) {
    super(props);

    this.state = { items: [], start: 0, selected: -1, row: 0, col: 0 };
    Emit.on("popupmenu:show", this.onPopupmenu.bind(this));
    Emit.on("popupmenu:select", this.onSelect.bind(this));
    Emit.on("popupmenu:hide", this.offPopupmenu.bind(this));
  }

  componentWillUnmount() {
    Emit.clear(["popupmenu:show", "popupmenu:select", "popupmenu:hide"]);
  }

  private onPopupmenu(state: States) {
    this.setState(state);
  }

  private onSelect(selected: number) {
    const start = this.state.start <= selected && selected <= this.state.start + 4
      ? this.state.start
      : Math.max(0, Math.min(this.state.items.length - 5, this.state.start - this.state.selected + selected));

    this.setState({ selected, start });
  }

  private offPopupmenu() {
    this.setState({ items: [] });
  }

  private onItem(i: number) {
    const num = i - this.state.selected;
    const cmd = num < 0 ? "<C-p>" : "<C-n>";

    Emit.share("envim:focus");
    Emit.send("envim:input", cmd.repeat(Math.abs(num)));
  }

  private getScopeStyle() {
    const { size, width, height } = font.get();
    return {
      ...styles.scope,
      top: this.state.row * height,
      left: this.state.col * width,
      fontSize: size - 1,
    };
  }

  private getKindStyle(kind: string) {
    if (kind === "") return "";
    switch (kind[0].toUpperCase()) {
      case "A": case "B": case "C": case "D": case "E": return "color-red-fg";
      case "F": case "G": case "H": case "I": case "J": return "color-green-fg";
      case "K": case "L": case "M": case "N": case "O": return "color-lightblue-fg";
      case "P": case "Q": case "R": case "S": case "T": return "color-purple-fg";
      case "U": case "V": case "W": case "X": case "Y": return "color-yellow-fg";
      case "Z": default: return "color-orange-fg";
    }
  }

  render() {
    const { start } = this.state;
    const end = Math.min(this.state.items.length, start + 5);

    return this.state.items.length === 0 ? null : (
      <div style={this.getScopeStyle()}>
        <div style={styles.popup}>
          {this.state.items.slice(start, end).map(({ word, kind, menu }, i) => (
            <div className={`color-black ${this.state.selected === i + start ? "active" : "clickable"}`} style={styles.line} onClick={() => this.onItem(i + start)} key={i}>
              <div style={styles.column}>{ word } { menu }</div>
              <div className={this.getKindStyle(kind)} style={styles.column}>{ kind }</div>
            </div>
          ))}
        </div>
        {this.state.items[this.state.selected]?.info && <div className="color-black active" style={styles.info}>{ this.state.items[this.state.selected]?.info }</div>}
      </div>
    )
  }
}
