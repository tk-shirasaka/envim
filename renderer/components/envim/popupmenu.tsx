import React, { createRef, RefObject } from "react";

import { Emit } from "../../utils/emit";
import { Setting } from "../../utils/setting";
import { Highlights } from "../../utils/highlight";
import { row2Y, col2X, x2Col } from "../../utils/size";

interface Props {
}

interface States {
  items: { word: string, kind: string, menu: string }[];
  selected: number;
  row: number;
  col: number;
}

const position: "absolute" = "absolute";
const whiteSpace: "break-spaces" = "break-spaces";
const styles = {
  scope: {
    zIndex: 10,
    position,
    overflow: "auto",
    boxShadow: "0 0 8px 0 rgba(0, 0, 0, 0.6)",
    whiteSpace,
  },
  line: {
    display: "table-row",
  },
};

export class PopupmenuComponent extends React.Component<Props, States> {
  private maxline: number = 5;
  private width: number = 0;
  private scope: RefObject<HTMLDivElement> = createRef<HTMLDivElement>();

  constructor(props: Props) {
    super(props);

    this.state = { items: [], selected: -1, row: 0, col: 0 };
    Emit.on("popupmenu:show", this.onPopupmenu.bind(this));
    Emit.on("popupmenu:select", this.onSelect.bind(this));
    Emit.on("popupmenu:hide", this.offPopupmenu.bind(this));
  }

  componentDidUpdate() {
    if (this.scope.current && this.width === 0 && this.state.items.length > 0) {
      const { row, col, items } = this.state;
      const width = x2Col(this.scope.current.clientWidth) + 2;
      const length = Math.min(items.length, this.maxline);

      Emit.send("envim:api", "nvim_ui_pum_set_bounds", [width, length, row, col]);
    }
  }

  componentWillUnmount() {
    Emit.clear(["popupmenu:show", "popupmenu:select", "popupmenu:hide"]);
  }

  private onPopupmenu(state: States) {
    this.width = 0;
    state.col--;

    this.setState(state);
  }

  private onSelect(selected: number) {
    const top = row2Y(Math.max(0, Math.min(selected, this.state.items.length - this.maxline)));

    this.setState({ selected });
    setTimeout(() => this.scope.current?.scrollTo({ top, behavior: "smooth" }));
  }

  private offPopupmenu() {
    this.setState({ items: [] });
  }

  private onItem(i: number) {
    const num = i - this.state.selected;
    const cmd = num < 0 ? "<C-p>" : "<C-n>";

    Emit.send("envim:input", cmd.repeat(Math.abs(num)));
  }

  private getScopeStyle() {
    return {
      ...styles.scope,
      transform: `translate(${col2X(this.state.col)}px, ${row2Y(this.state.row)}px)`,
      maxHeight: row2Y(this.maxline),
    };
  }

  private getKindStyle(kind: string) {
    switch (kind[0].charCodeAt(0) % 6) {
      case 0: return "red";
      case 1: return "green";
      case 2: return "lightblue";
      case 3: return "purple";
      case 4: return "yellow";
      case 5: return "orange";
      default: return "0";
    }
  }

  render() {
    const column = { padding: `0 ${Setting.font.width}px`, display: "table-cell" };

    return this.state.items.length === 0 ? null : (
      <div className="animate fade-in" style={this.getScopeStyle()} ref={this.scope}>
        {this.state.items.map(({ word, kind, menu }, i) => (
          <div className={this.state.selected === i ? "bold" : ""} style={styles.line} onClick={() => this.onItem(i)} key={i}>
            <div style={{ ...Highlights.style("0", this.state.selected === i), ...column }}>{ word }</div>
            <div style={{ ...Highlights.style(this.getKindStyle(`${kind} ${menu}`), this.state.selected === i), ...column }}>{ kind } { menu }</div>
          </div>
        ))}
      </div>
    )
  }
}
