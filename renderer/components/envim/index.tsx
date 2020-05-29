import React from "react";

import { IHighlight } from "common/interface";

import { Emit } from "../../utils/emit";
import { Highlights } from "../../utils/highlight";
import { Setting } from "../../utils/setting";
import { y2Row, row2Y, col2X } from "../../utils/size";

import { TablineComponent } from "./tabline";
import { EditorComponent } from "./editor";
import { HistoryComponent } from "./history";
import { CmdlineComponent } from "./cmdline";
import { PopupmenuComponent } from "./popupmenu";
import { NotificateComponent } from "./notificate";
import { InputComponent } from "./input";

interface Props {
  window: { width: number; height: number; };
}

interface States {
  style: { background: string; color: string; borderColor: string; };
  options: { [k: string]: boolean };
  grids: {
    grid: number;
    style: {
      width: number;
      height: number;
      top: number;
      left: number;
      zIndex: number;
      cursor: "text" | "not-allowed";
    };
  }[];
  mouse: boolean;
}

const positionR: "relative" = "relative"
const positionA: "absolute" = "absolute"
const styles = {
  editor: {
    position: positionR,
    overflow: "hidden",
  },
  grid: {
    position: positionA,
    margin: 0,
    padding: 0,
  },
};

export class EnvimComponent extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);

    this.state = { style: { background: "", color: "", borderColor: "" }, options: {}, grids: [], mouse: false };
    Emit.on("highlight:set", this.onHighlight.bind(this));
    Emit.on("highlight:name", this.onHlGroup.bind(this));
    Emit.on("win:pos", this.onWin.bind(this));
    Emit.on("win:hide", this.hideWin.bind(this));
    Emit.on("win:close", this.closeWin.bind(this));
    Emit.on("envim:title", this.onTitle.bind(this));
    Emit.on("envim:mouse", this.onMouse.bind(this));
    Emit.on("envim:option", this.onOption.bind(this));
  }

  componentWillUnmount() {
    Emit.clear(["highlight:set", "highlight:name", "win:pos", "win:hide", "win:close", "envim:title", "envim:mouse", "envim:option"]);
  }

  private onHighlight(highlights: {id: number, hl: IHighlight}[]) {
    highlights.forEach(({id, hl}) => {
      Highlights.setHighlight(id, hl);

      if (id === 0) {
        const style = Highlights.style(id);
        JSON.stringify(this.state.style) === JSON.stringify(style) || this.setState({ style });
      }
    });
  }

  private onHlGroup(groups: {id: number, name: string}[]) {
    groups.forEach(({id, name}) => Highlights.setName(id, name));
  }

  private onWin(grid: number, width: number, height: number, top: number, left: number, focusable: boolean) {
    const grids = this.state.grids;
    const cursor: "text" | "not-allowed" = focusable ? "text" : "not-allowed";
    const zIndex = 0;

    [ height, width ] = [ row2Y(height), col2X(width) ];
    [ top, left ] = [ row2Y(top), col2X(left) ];

    const style = { width, height, top, left, cursor, zIndex };

    grids.some((item, i) => {
      if (item.grid !== grid) return false;

      grids[i] = { grid, style };
      return true;
    }) || grids.push({ grid, style });

    this.setState({ grids });
  }

  private hideWin(grid: number) {
    const grids = this.state.grids.map(item => {
      if (item.grid !== grid) return item;
      item.style.zIndex = -1;

      return JSON.parse(JSON.stringify(item));
    });

    this.setState({ grids: [...grids] });
  }

  private closeWin(grid: number) {
    const grids = this.state.grids.filter(item => item.grid !== grid);
    this.setState({ grids });
  }

  private onTitle(title: string) {
    document.title = title || 'Envim';
  }

  private onMouse(mouse: boolean) {
    this.setState({ mouse });
  }

  private onOption(options: { [k: string]: boolean }) {
    this.setState({ options: Object.assign(options, this.state.options) });
  }

  render() {
    const { height } = Setting.font;
    const { width } = this.props.window;
    const offset = this.state.options.ext_tabline ? height + 4 : 0;
    const editor = { width, height: row2Y(y2Row(this.props.window.height - offset)) };
    const header = { width, height: this.props.window.height - editor.height };
    const footer = { width, height: Math.min(editor.height, height * 15) };

    return (
      <div style={this.state.style}>
        { this.state.options.ext_tabline ? <TablineComponent {...header} /> : null }
        <div style={{...styles.editor, ...editor}}>
          <EditorComponent grid={1} mouse={this.state.mouse} style={{ ...editor, top: 0, left: 0 }} />
          { this.state.grids.map(item => (
            <EditorComponent key={item.grid} grid={item.grid} mouse={this.state.mouse} style={item.style} />
          )) }
          { this.state.options.ext_messages ? <HistoryComponent {...footer} /> : null }
          { this.state.options.ext_cmdline ? <CmdlineComponent /> : null }
          { this.state.options.ext_popupmenu ? <PopupmenuComponent /> : null }
          { this.state.options.ext_messages ? <NotificateComponent /> : null }
          <InputComponent />
        </div>
      </div>
    );
  }
}
