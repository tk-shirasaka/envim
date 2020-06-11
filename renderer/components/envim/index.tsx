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
  main: { width: number; height: number; };
  options: { [k: string]: boolean };
  mouse: boolean;
}

interface States {
  grids: { [k: string]: {
    width: number;
    height: number;
    top: number;
    left: number;
    display?: "block" | "none";
    cursor: "text" | "not-allowed";
  }};
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

    this.state = { grids: {} };
    Emit.on("highlight:set", this.onHighlight.bind(this));
    Emit.on("highlight:name", this.onHlGroup.bind(this));
    Emit.on("win:pos", this.onWin.bind(this));
    Emit.on("win:hide", this.hideWin.bind(this));
    Emit.on("win:close", this.closeWin.bind(this));
  }

  componentWillUnmount() {
    Emit.clear(["highlight:set", "highlight:name", "win:pos", "win:hide", "win:close"]);
  }

  private onHighlight(highlights: {id: number, hl: IHighlight}[]) {
    highlights.forEach(({id, hl}) => {
      Highlights.setHighlight(id, hl);
    });
  }

  private onHlGroup(groups: {id: number, name: string}[]) {
    groups.forEach(({id, name}) => Highlights.setName(id, name));
  }

  private onWin(grid: number, width: number, height: number, top: number, left: number, focusable: boolean) {
    const grids = this.state.grids;
    const cursor: "text" | "not-allowed" = focusable ? "text" : "not-allowed";
    const display = "block";

    [ height, width ] = [ row2Y(height), col2X(width) ];
    [ top, left ] = [ row2Y(top), col2X(left) ];

    grids[grid] = { width, height, top, left, cursor, display };

    this.setState({ grids });
  }

  private hideWin(grid: number) {
    const grids = this.state.grids;

    grids[grid].display = "none";

    this.setState({ grids });
  }

  private closeWin(grid: number) {
    const grids = this.state.grids;

    delete(grids[grid]);

    this.setState({ grids });
  }

  render() {
    const { height, size } = Setting.font;
    const { width } = this.props.main;
    const offset = this.props.options.ext_tabline ? height + 4 : 0;
    const editor = { width, height: row2Y(y2Row(this.props.main.height - offset)) };
    const header = { width, height: this.props.main.height - editor.height };
    const footer = { width, height: Math.min(editor.height, height * 15) };
    const style = { fontSize: size, lineHeight: `${height}px` };

    return (
      <div style={style}>
        { this.props.options.ext_tabline ? <TablineComponent {...header} /> : null }
        <div style={{...styles.editor, ...editor}}>
          <EditorComponent grid={1} mouse={this.props.mouse} style={{ ...editor, top: 0, left: 0 }} />
          { Object.keys(this.state.grids).map(grid => (
            <EditorComponent key={grid} grid={+grid} mouse={this.props.mouse} style={this.state.grids[+grid]} />
          )) }
          { this.props.options.ext_messages ? <HistoryComponent {...footer} /> : null }
          { this.props.options.ext_cmdline ? <CmdlineComponent /> : null }
          { this.props.options.ext_popupmenu ? <PopupmenuComponent /> : null }
          { this.props.options.ext_messages ? <NotificateComponent /> : null }
          <InputComponent />
        </div>
      </div>
    );
  }
}
