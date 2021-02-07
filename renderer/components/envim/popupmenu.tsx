import React from "react";

import { Emit } from "../../utils/emit";
import { Setting } from "../../utils/setting";
import { row2Y, col2X } from "../../utils/size";

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
    overflow: "hidden",
    boxShadow: "8px 8px 4px 0 rgba(0, 0, 0, 0.6)",
    whiteSpace,
  },
  line: {
    display: "flex",
    justifyContent: "space-between",
  },
};

export class PopupmenuComponent extends React.Component<Props, States> {
  private maxline: number = 5;

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

  private getItems(state: States) {
    const { start } = state;
    const end = Math.min(state.items.length, start + this.maxline);

    return state.items.slice(start, end)
  }

  private sendPum(state: States) {
    const { row, col } = state;
    const items = this.getItems(state);
    const width = Math.max(...items.map(({ word, menu, kind }) => [word, menu, kind].join("").length)) + 5;

    Emit.send("envim:api", "nvim_ui_pum_set_bounds", [width, items.length, row, col]);
  }

  private onPopupmenu(state: States) {
    this.sendPum(state);
    this.setState(state);
  }

  private onSelect(selected: number) {
    const start = this.state.start <= selected && selected <= this.state.start + this.maxline - 1
      ? this.state.start
      : Math.max(0, Math.min(this.state.items.length - this.maxline, this.state.start - this.state.selected + selected));

    this.sendPum({ ...this.state, selected, start });
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
    const { size, height, width } = Setting.font;
    return {
      ...styles.scope,
      top: row2Y(this.state.row),
      left: col2X(this.state.col) - width,
      fontSize: size,
      lineHeight: `${height}px`,
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
    const { start } = this.state;
    const items = this.getItems(this.state);
    const column = { padding: `0 ${Setting.font.width}px` };

    return items.length === 0 ? null : (
      <div className="animate fade-in" style={this.getScopeStyle()}>
        {items.map(({ word, kind, menu }, i) => (
          <div className={`color-black ${this.state.selected === i + start ? "active" : "clickable"}`} style={styles.line} onClick={() => this.onItem(i + start)} key={i}>
            <div style={column}>{ word } { menu }</div>
            <div className={this.getKindStyle(kind)} style={column}>{ kind }</div>
          </div>
        ))}
      </div>
    )
  }
}
