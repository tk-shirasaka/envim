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
    transform: string;
    display: "block" | "none";
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
    Emit.clear(["highlight:set", "win:pos", "win:hide", "win:close"]);
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
  }

  private onWin(grid: number, width: number, height: number, top: number, left: number, focusable: boolean, zIndex: number) {
    const grids = this.state.grids;
    const cursor: "default" | "not-allowed" = focusable ? "default" : "not-allowed";
    const display: "block" = "block";
    const transform = `translate(${col2X(left)}px, ${row2Y(top)}px)`;

    [ height, width ] = [ row2Y(height), col2X(width) ];

    const next = { width, height, transform, cursor, display, zIndex };

    if (JSON.stringify(grids[grid]) !== JSON.stringify(next)) {
      grids[grid] = next;
      this.setState({ grids });
    }
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
    const grids = Object.keys(this.state.grids).length;

    return (
      <div style={this.main}>
        <TablineComponent {...this.header} />
        <div style={{...styles.editor, ...this.editor}}>
          { Object.keys(this.state.grids).reverse().map(grid => (
            <EditorComponent key={grid} grid={+grid} fill={!(+grid === 1 && grids > 1)} style={this.state.grids[+grid]} />
          )) }
          <CmdlineComponent />
          <PopupmenuComponent />
          <NotificateComponent />
          <InputComponent />
        </div>
        { Setting.options.ext_messages && <HistoryComponent {...this.footer} /> }
      </div>
    );
  }
}
