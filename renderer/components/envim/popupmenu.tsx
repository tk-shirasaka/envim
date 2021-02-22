import React, { createRef, RefObject } from "react";

import { Emit } from "../../utils/emit";
import { Setting } from "../../utils/setting";
import { row2Y, col2X, x2Col } from "../../utils/size";

interface Props {
}

interface States {
  items: { word: string, kind: string, menu: string }[];
  start: number;
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
    whiteSpace,
    overflow: "hidden",
  },
  viewer: {
    display: "table",
    boxShadow: "8px 8px 4px 0 rgba(0, 0, 0, 0.6)",
  },
  line: {
    display: "table-row",
  },
};

export class PopupmenuComponent extends React.Component<Props, States> {
  private maxline: number = 5;
  private width: number = 0;
  private viewer: RefObject<HTMLDivElement> = createRef<HTMLDivElement>();

  constructor(props: Props) {
    super(props);

    this.state = { items: [], start: 0, selected: -1, row: 0, col: 0 };
    Emit.on("popupmenu:show", this.onPopupmenu.bind(this));
    Emit.on("popupmenu:select", this.onSelect.bind(this));
    Emit.on("popupmenu:hide", this.offPopupmenu.bind(this));
  }

  componentDidUpdate() {
    if (this.viewer.current && this.width === 0 && this.state.items.length > 0) {
      const { row, col, items } = this.state;
      const width = x2Col(this.viewer.current.clientWidth) + 1;
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
    const start = this.state.start <= selected && selected <= this.state.start + this.maxline - 1
      ? this.state.start
      : Math.max(0, Math.min(this.state.items.length - this.maxline, this.state.start - this.state.selected + selected));

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
    const { size, height } = Setting.font;
    return {
      ...styles.scope,
      transform: `translate(${col2X(this.state.col)}px, ${row2Y(this.state.row)}px)`,
      fontSize: size,
      lineHeight: `${height}px`,
      maxHeight: row2Y(this.maxline),
    };
  }

  private getViewerStyle() {
    return {
      ...styles.viewer,
      transform: `translate(0, ${row2Y(-this.state.start)}px)`,
    };
  }

  private getKindStyle(kind: string) {
    if (kind === "") return "";
    switch (kind[0].charCodeAt(0) % 6) {
      case 0: return "bold color-red-fg";
      case 1: return "bold color-green-fg";
      case 2: return "bold color-lightblue-fg";
      case 3: return "bold color-purple-fg";
      case 4: return "bold color-yellow-fg";
      case 5: return "bold color-orange-fg";
    }
  }

  render() {
    const column = { padding: `0 ${Setting.font.width}px`, display: "table-cell" };

    return this.state.items.length === 0 ? null : (
      <div style={this.getScopeStyle()}>
        <div className="animate fade-in" style={this.getViewerStyle()} ref={this.viewer}>
          {this.state.items.map(({ word, kind, menu }, i) => (
            <div className={`color-black ${this.state.selected === i ? "active" : "clickable"}`} style={styles.line} onClick={() => this.onItem(i)} key={i}>
              <div style={column}>{ word }</div>
              <div className={this.getKindStyle(kind)} style={column}>{ kind }</div>
              <div className={this.getKindStyle(menu)} style={column}>{ menu }</div>
            </div>
          ))}
        </div>
      </div>
    )
  }
}
