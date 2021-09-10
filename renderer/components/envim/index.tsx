import React from "react";

import { IWindow, IHighlight } from "common/interface";

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
    visibility: "visible" | "hidden";
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
  private refresh: boolean = false;
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
    Emit.on("option:set", this.onOption.bind(this));
    Emit.send("envim:attach", x2Col(this.editor.width), y2Row(this.editor.height), Setting.options);
  }

  componentDidUpdate({width, height}: Props) {
    if (this.props.width === width && this.props.height === height) return

    this.setSize();
    Emit.send("envim:resize", 1, x2Col(this.editor.width), y2Row(this.editor.height));
  }

  componentWillUnmount() {
    Emit.clear(["highlight:set", "win:pos", "option:set"]);
  }

  private setSize() {
    const font  = Setting.font;
    const padding = this.props.height % font.height;
    const space = font.height * (Setting.options.ext_messages ? 2 : 1) + (padding < 16 ? font.height : 0);
    this.main = { fontSize: font.size, lineHeight: `${font.height}px` };
    this.editor = { width: this.props.width, height: this.props.height - padding - space };
    this.footer = { width: this.props.width, height: Setting.options.ext_messages ? font.height + 4 : 0 };
    this.header = { width: this.props.width, height: this.props.height - this.editor.height - this.footer.height };
  }

  private onHighlight(highlights: {id: string, ui: boolean, hl: IHighlight}[]) {
    highlights.forEach(({id, ui, hl}) => {
      Highlights.setHighlight(id, ui, hl);
    });
  }

  private onWin(wins: IWindow[]) {
    const grids = this.state.grids;

    wins.forEach(({ id, x, y, width, height, zIndex, focusable, status }) => {
      const cursor: "default" | "not-allowed" = focusable ? "default" : "not-allowed";
      const visibility: "visible" | "hidden" = status === "show" ? "visible" : "hidden";
      const transform = `translate(${col2X(x)}px, ${row2Y(y)}px)`;

      [ height, width ] = [ row2Y(height), col2X(width) ];

      const next = { width, height, transform, cursor, visibility, zIndex };

      if (status === "delete") {
        delete(grids[id]);
        this.refresh = true;
      } else if (JSON.stringify(grids[id]) !== JSON.stringify(next)) {
        grids[id] = next;
        this.refresh = this.refresh || (zIndex < 5 && (grids[id]?.width !== width || grids[id]?.height !== height));
      }
    });

    this.setState({ grids });
    this.refresh && Emit.send("envim:command", "mode");
    this.refresh = false;
  }

  private onOption(options: { [k: string]: boolean }) {
    Setting.options = options;
  }

  private onMouseUp() {
    Emit.share("envim:focus");
  }

  render() {
    return (
      <div style={this.main} onMouseUp={this.onMouseUp}>
        <TablineComponent {...this.header} />
        <div style={{...styles.editor, ...this.editor}}>
          { Object.keys(this.state.grids).reverse().map(grid => (
            <EditorComponent key={grid} grid={+grid} editor={this.editor} style={this.state.grids[+grid]} />
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
