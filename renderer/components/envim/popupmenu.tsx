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
  clicked: boolean;
  row: number;
  col: number;
  height: number;
  zIndex: number;
  enabled: boolean;
}

export class PopupmenuComponent extends React.Component<Props, States> {
  private width: number = 0;
  private scope: RefObject<HTMLDivElement> = createRef<HTMLDivElement>();

  constructor(props: Props) {
    super(props);

    this.state = { items: [], selected: -1, clicked: false, row: 0, col: 0, height: 0, zIndex: 0, enabled: Setting.options.ext_popupmenu  };

    Emit.on("popupmenu:show", this.onPopupmenu);
    Emit.on("popupmenu:select", this.onSelect);
    Emit.on("popupmenu:hide", this.offPopupmenu);
    Emit.on("option:set", this.onOption);
  }

  componentDidUpdate(_: Props, state: States) {
    if (!this.scope.current || this.state.items.length === 0) return;

    const { row, col, height } = this.state;
    const width = x2Col(this.scope.current.clientWidth) + 2;

    if (row === state.row && col === state.col && height === state.height && this.width === width) return;

    this.width = width;
    Emit.send("envim:api", "nvim_ui_pum_set_bounds", [width, height, row, col]);
  }

  componentWillUnmount = () => {
    Emit.off("popupmenu:show", this.onPopupmenu);
    Emit.off("popupmenu:select", this.onSelect);
    Emit.off("popupmenu:hide", this.offPopupmenu);
    Emit.off("option:set", this.onOption);
  }

  private onPopupmenu = (state: States) => {
    state.col--;

    this.setState(state);
    Emit.share("envim:drag", -2);
  }

  private onSelect = (selected: number) => {
    const top = row2Y(Math.max(0, Math.min(selected, this.state.items.length - this.state.height)));

    this.state.clicked || setTimeout(() => this.scope.current?.parentElement?.scrollTo({ top, behavior: "smooth" }));
    this.setState({ selected, clicked: false });
  }

  private offPopupmenu = () => {
    this.setState({ items: [] });
    Emit.share("envim:drag", -1);
  }

  private onOption = (options: { ext_popupmenu: boolean }) => {
    options.ext_popupmenu === undefined || this.setState({ enabled: options.ext_popupmenu });
  }

  private onItem(i: number) {
    this.setState({ clicked: true });
    Emit.send("envim:api", "nvim_select_popupmenu_item", [i, true, false, {}]);
  }

  private getScopeStyle() {
    return {
      transform: `translate(${col2X(this.state.col)}px, ${row2Y(this.state.row)}px)`,
      height: row2Y(this.state.height),
      zIndex: this.state.zIndex,
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
      default: return "default";
    }
  }

  render() {
    return this.state.enabled && this.state.items.length > 0 && (
      <FlexComponent animate="fade-in" color="default" direction="column" position="absolute" overflow="auto" whiteSpace="pre-wrap" style={this.getScopeStyle()} shadow>
        <div ref={this.scope}></div>
        {this.state.items.map(({ word, kind, menu }, i) => (
          <FlexComponent active={this.state.selected === i} onClick={() => this.onItem(i)} key={i}>
            <FlexComponent padding={[0, Setting.font.width]} grow={1} style={Highlights.style("0")}>{ word }</FlexComponent>
            { `${kind}${menu}` && <FlexComponent padding={[0, Setting.font.width]} color={this.getKindStyle(`${kind}${menu}`)}>{ kind } { menu }</FlexComponent> }
          </FlexComponent>
        ))}
      </FlexComponent>
    )
  }
}
