import React from "react";

import { IWindow, IHighlight } from "common/interface";

import { Emit } from "../../utils/emit";
import { Highlights } from "../../utils/highlight";
import { Setting } from "../../utils/setting";
import { y2Row, x2Col, row2Y, col2X } from "../../utils/size";

import { FlexComponent } from "../flex";

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
  pause: boolean;
  grids: { [k: string]: {
    grid: number;
    winid: number;
    transparent: boolean;
    style: {
      zIndex: number;
      width: number;
      height: number;
      transform: string;
      visibility: "visible" | "hidden";
      cursor: "default" | "not-allowed";
      pointerEvents: "none" | "auto";
    };
  }};
}

const styles = {
  backdrop: {
    zIndex: 100,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    opacity: 0.4,
    cusor: "wait",
  }
};

export class EnvimComponent extends React.Component<Props, States> {
  private refresh: boolean = false;
  private main: { fontSize: number; lineHeight: string; } = { fontSize: 0, lineHeight: "" };
  private editor: { width: number; height: number; } = { width: 0, height: 0 };
  private header: { height: number; padding: string } = { height: 0, padding: "" };
  private footer: { width: number; height: number; } = { width: 0, height: 0 };

  constructor(props: Props) {
    super(props);

    this.setSize();
    this.state = { pause: false, grids: {} };
    Emit.on("highlight:set", this.onHighlight.bind(this));
    Emit.on("win:pos", this.onWin.bind(this));
    Emit.on("option:set", this.onOption.bind(this));
    Emit.on("envim:drag", this.onDrag.bind(this));
    Emit.on("envim:pause", this.onPause.bind(this));
    Emit.send("envim:attach", x2Col(this.editor.width), y2Row(this.editor.height), Setting.options);
  }

  componentDidUpdate({width, height}: Props) {
    if (this.props.width === width && this.props.height === height) return

    this.setSize();
    Emit.send("envim:resize", 1, x2Col(this.editor.width), y2Row(this.editor.height));
  }

  componentWillUnmount() {
    Emit.clear(["highlight:set", "win:pos", "option:set", "envim:drag", "envim:pause"]);
  }

  private setSize() {
    const font  = Setting.font;
    const titlebar = navigator.windowControlsOverlay.getBoundingClientRect
      ? navigator.windowControlsOverlay.getBoundingClientRect()
      : { x: 0, y: 0, width: 0, height: 0, left: 0, right: 0 };

    this.main = { fontSize: font.size, lineHeight: `${font.height}px` };
    this.header = {
      height: Math.min(row2Y(2), (titlebar.y * 2) + titlebar.height || row2Y(2)),
      padding: titlebar.left ? `0 0 0 ${titlebar.left}px` : `0 ${titlebar.width}px 0 0`,
    };
    this.editor = {
      width: col2X(x2Col(this.props.width)),
      height: row2Y(y2Row(this.props.height - this.header.height - (Setting.options.ext_messages ? font.height + 4 : 0))),
    };
    this.footer = { width: this.props.width, height: this.props.height - this.header.height - this.editor.height };
  }

  private onHighlight(highlights: {id: string, ui: boolean, hl: IHighlight}[]) {
    highlights.forEach(({id, ui, hl}) => {
      Highlights.setHighlight(id, ui, hl);
    });
  }

  private onWin(wins: IWindow[]) {
    const grids = this.state.grids;

    wins.forEach(({ id, winid, x, y, width, height, zIndex, focusable, transparent, status }) => {
      const curr = grids[id]?.style || {};
      const next = {
        zIndex,
        width: col2X(width),
        height: row2Y(height),
        transform: `translate(${col2X(x)}px, ${row2Y(y)}px)`,
        visibility: status === "show" ? "visible" : "hidden" as "visible" | "hidden",
        cursor: focusable ? "default" : "not-allowed" as "default" | "not-allowed",
        pointerEvents: curr.pointerEvents || "auto" as "none" | "auto",
      };

      this.refresh = this.refresh || status !== "show";
      if (status === "delete") {
        delete(grids[id]);
      } else if (JSON.stringify(curr) !== JSON.stringify(next)) {
        this.refresh = this.refresh || (zIndex < 5 && (curr.width !== next.width || curr.height !== next.height));
        grids[id] = { grid: id, winid, transparent, style: next };
      }
    });

    this.setState({ grids });
    this.refresh && Emit.send("envim:command", "mode");
    this.refresh = false;
  }

  private onOption(options: { [k: string]: boolean }) {
    Setting.options = options;
  }

  private onDrag(drag: number) {
    const grids = this.state.grids;

    Object.keys(grids).forEach(grid => {
      grids[grid].style.pointerEvents = drag < 0 || drag === +grid ? "auto" : "none";
    })

    this.setState({ grids });
  }

  private onPause(pause: boolean) {
    this.setState({ pause });
  }

  private onMouseUp() {
    this.onDrag(-1);
    Emit.share("envim:focus");
  }

  render() {
    return (
      <div style={this.main} onMouseUp={this.onMouseUp.bind(this)}>
        <TablineComponent {...this.header} />
        <FlexComponent>
          <FlexComponent style={this.editor}>
            { Object.values(this.state.grids).reverse().map(grid => (
              <EditorComponent key={grid.grid} editor={this.editor} { ...grid } />
            )) }
            <CmdlineComponent />
            <PopupmenuComponent />
            <NotificateComponent />
            <InputComponent />
          </FlexComponent>
          <FlexComponent color="black" grow={1} shrink={1} shadow />
        </FlexComponent>
        { Setting.options.ext_messages && <HistoryComponent {...this.footer} /> }
        { this.state.pause && <FlexComponent color="black" position="absolute" style={styles.backdrop} /> }
      </div>
    );
  }
}
