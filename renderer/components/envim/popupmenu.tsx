import React, { createRef, RefObject } from "react";

import { Emit } from "../../utils/emit";
import { Setting } from "../../utils/setting";
import { Highlights } from "../../utils/highlight";
import { row2Y, col2X, x2Col } from "../../utils/size";

import { FlexComponent } from "../flex";

interface Props {
}

interface States {
  items: { word: string, kind: string, menu: string }[];
  selected: number;
  row: number;
  col: number;
  height: number;
}

const styles = {
  scope: {
    zIndex: 20,
  },
};

export class PopupmenuComponent extends React.Component<Props, States> {
  private width: number = 0;
  private scope: RefObject<HTMLDivElement> = createRef<HTMLDivElement>();

  constructor(props: Props) {
    super(props);

    this.state = { items: [], selected: -1, row: 0, col: 0, height: 0 };
    Emit.on("popupmenu:show", this.onPopupmenu);
    Emit.on("popupmenu:select", this.onSelect);
    Emit.on("popupmenu:hide", this.offPopupmenu);
  }

  componentDidUpdate() {
    if (this.scope.current && this.width === 0 && this.state.items.length > 0) {
      const { row, col, height } = this.state;
      const width = x2Col(this.scope.current.clientWidth) + 2;

      Emit.send("envim:api", "nvim_ui_pum_set_bounds", [width, height, row, col]);
    }
  }

  componentWillUnmount() {
    Emit.clear(["popupmenu:show", "popupmenu:select", "popupmenu:hide"]);
  }

  private onPopupmenu = (state: States) => {
    this.width = 0;
    state.col--;

    this.setState(state);
  }

  private onSelect = (selected: number) => {
    const top = row2Y(Math.max(0, Math.min(selected, this.state.items.length - this.state.height)));

    this.setState({ selected });
    setTimeout(() => this.scope.current?.parentElement?.scrollTo({ top, behavior: "smooth" }));
  }

  private offPopupmenu = () => {
    this.setState({ items: [] });
  }

  private onItem(i: number) {
    Emit.send("envim:api", "nvim_select_popupmenu_item", [i, true, false, {}]);
  }

  private getScopeStyle() {
    return {
      ...styles.scope,
      transform: `translate(${col2X(this.state.col)}px, ${row2Y(this.state.row)}px)`,
      height: row2Y(this.state.height),
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
    return this.state.items.length === 0 ? null : (
      <FlexComponent animate="fade-in" direction="column" position="absolute" overflow="auto" whiteSpace="pre-wrap" style={this.getScopeStyle()} shadow>
        <div ref={this.scope}></div>
        {this.state.items.map(({ word, kind, menu }, i) => (
          <FlexComponent onClick={() => this.onItem(i)} key={i}>
            <FlexComponent padding={[0, Setting.font.width]} grow={1} style={Highlights.style("0", { reverse: this.state.selected === i })}>{ word }</FlexComponent>
            <FlexComponent padding={[0, Setting.font.width]} style={Highlights.style(this.getKindStyle(`${kind} ${menu}`), { reverse: this.state.selected !== i })}>{ kind } { menu }</FlexComponent>
          </FlexComponent>
        ))}
      </FlexComponent>
    )
  }
}
