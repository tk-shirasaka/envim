import React from "react";

import { IHighlight } from "common/interface";

import { Emit } from "../../utils/emit";
import { Highlights } from "../../utils/highlight";
import { Setting } from "../../utils/setting";
import { y2Row, x2Col, row2Y, col2X } from "../../utils/size";

import { TablineComponent } from "./tabline";
import { EditorComponent } from "./editor";
import { HistoryComponent } from "./history";
import { CmdlineComponent } from "./cmdline";
import { PopupmenuComponent } from "./popupmenu";
import { NotificateComponent } from "./notificate";
import { InputComponent } from "./input";

interface Props {
  width: number;
  height: number;
}

interface States {
  grids: { [k: string]: {
    zIndex: number;
    width: number;
    height: number;
    top: number;
    left: number;
    display?: "block" | "none";
    cursor: "default" | "not-allowed";
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
  private timer: number = 0;
  private main: { fontSize: number; lineHeight: string; } = { fontSize: 0, lineHeight: "" };
  private editor: { width: number; height: number; } = { width: 0, height: 0 };
  private header: { width: number; height: number; } = { width: 0, height: 0 };
  private footer: { width: number; height: number; } = { width: 0, height: 0 };

  constructor(props: Props) {
    super(props);

    this.setSize();
    this.state = { grids: {} };
    Emit.on("highlight:set", this.onHighlight.bind(this));
    Emit.on("grid:resize", this.onResize.bind(this));
    Emit.on("win:pos", this.onWin.bind(this));
    Emit.on("win:hide", this.hideWin.bind(this));
    Emit.on("win:close", this.closeWin.bind(this));
    Emit.send("envim:attach", x2Col(this.editor.width), y2Row(this.editor.height));
  }

  componentDidUpdate() {
    this.setSize();
    this.timer && clearTimeout(this.timer)
    this.timer = +setTimeout(() => {
      Emit.send("envim:resize", 1, x2Col(this.editor.width), y2Row(this.editor.height));
    }, 200);
  }

  componentWillUnmount() {
    Emit.clear(["highlight:set", "grid:resize", "win:pos", "win:hide", "win:close"]);
  }

  private setSize() {
    const font  = Setting.font;
    this.main = { fontSize: font.size, lineHeight: `${font.height}px` };
    this.editor = { width: this.props.width, height: row2Y(y2Row(this.props.height - 8) - 1) };
    this.header = { width: this.props.width, height: this.props.height - this.editor.height };
    this.footer = { width: this.props.width, height: Setting.options.ext_messages ? Math.min(this.editor.height, font.height * 15) : 0 };
    this.editor.height -= this.footer.height;
  }

  private onHighlight(highlights: {id: number, ui: boolean, hl: IHighlight}[]) {
    highlights.forEach(({id, ui, hl}) => {
      Highlights.setHighlight(id, ui, hl);
    });
    Object.keys(this.state.grids).length === 0 && this.onWin(1, x2Col(this.editor.width), y2Row(this.editor.height), 0, 0, true, 0)
  }

  private onResize(grid: number, width: number, height: number) {
    if (this.state.grids[grid]) {
      const grids = this.state.grids;
      const { top, left, cursor, display, zIndex } = grids[grid];

      [ height, width ] = [ row2Y(height), col2X(width) ];
      grids[grid] = { width, height, top, left, cursor, display, zIndex };

      this.setState({ grids });
    }
  }

  private onWin(grid: number, width: number, height: number, top: number, left: number, focusable: boolean, zIndex: number) {
    const grids = this.state.grids;
    const cursor: "default" | "not-allowed" = focusable ? "default" : "not-allowed";
    const display = "block";

    [ height, width ] = [ row2Y(height), col2X(width) ];
    [ top, left ] = [ row2Y(top), col2X(left) ];

    grids[grid] = { width, height, top, left, cursor, display, zIndex };

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
    return (
      <div style={this.main}>
        <TablineComponent {...this.header} />
        <div style={{...styles.editor, ...this.editor}}>
          { Object.keys(this.state.grids).length === 0 ? <div className="color-black" style={this.editor}>Loading...</div> : Object.keys(this.state.grids).map(grid => (
            <EditorComponent key={grid} grid={+grid} style={this.state.grids[+grid]} />
          )) }
          <CmdlineComponent />
          <PopupmenuComponent />
          <NotificateComponent />
          <InputComponent />
        </div>
        { Setting.options.ext_messages && Object.keys(this.state.grids).length && <HistoryComponent {...this.footer} /> }
      </div>
    );
  }
}
