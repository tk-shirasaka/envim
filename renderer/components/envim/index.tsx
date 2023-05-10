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
  mousemoveevent: boolean;
  grids: { [k: string]: {
    grid: number;
    winid: number;
    order: number;
    focusable: boolean;
    type: "normal" | "floating" | "external";
    style: {
      zIndex: number;
      width: number;
      height: number;
      transform: string;
      visibility: "visible" | "hidden";
    };
  }};
}

const styles = {
  backdrop: {
    zIndex: 100,
    opacity: 0.2,
    cursor: "wait",
  }
};

export class EnvimComponent extends React.Component<Props, States> {
  private refresh: boolean = false;
  private main: { fontSize: number; lineHeight: string; } = { fontSize: 0, lineHeight: "" };
  private editor: { width: number; height: number; zIndex: number } = { width: 0, height: 0, zIndex: 0 };
  private header: { width: number; height: number; padding: string } = { width: 0, height: 0, padding: "" };
  private footer: { width: number; height: number; } = { width: 0, height: 0 };

  constructor(props: Props) {
    super(props);

    this.setSize();
    this.state = { pause: false, mousemoveevent: false, grids: {} };
    Emit.on("highlight:set", this.onHighlight);
    Emit.on("win:pos", this.onWin);
    Emit.on("option:set", this.onOption);
    Emit.on("envim:pause", this.onPause);
    Emit.send("envim:attach", x2Col(this.editor.width), y2Row(this.editor.height), Setting.options);
  }

  componentDidUpdate({width, height}: Props) {
    if (this.props.width === width && this.props.height === height) return

    this.setSize();
    Emit.send("envim:resize", 0, x2Col(this.editor.width), y2Row(this.editor.height));
  }

  componentWillUnmount = () => {
    Emit.off("highlight:set", this.onHighlight);
    Emit.off("win:pos", this.onWin);
    Emit.off("option:set", this.onOption);
    Emit.off("envim:pause", this.onPause);
  }

  private setSize() {
    const font  = Setting.font;
    const titlebar = navigator.windowControlsOverlay.getTitlebarAreaRect
      ? navigator.windowControlsOverlay.getTitlebarAreaRect()
      : { x: 0, y: 0, width: 0, height: 0, left: 0, right: 0 };

    this.main = { fontSize: font.size, lineHeight: `${font.height}px` };
    this.header = {
      width: titlebar.width + titlebar.left,
      height: Math.min(row2Y(2), (titlebar.y * 2) + titlebar.height || row2Y(2)),
      padding: titlebar.left ? `0 0 0 ${titlebar.left}px` : `0`,
    };
    this.editor = {
      width: col2X(x2Col(this.props.width) - 2),
      height: row2Y(y2Row(this.props.height - this.header.height - font.height - 4)),
      zIndex: 0,
    };
    this.footer = { width: this.props.width, height: this.props.height - this.header.height - this.editor.height };
  }

  private onHighlight = (highlights: {id: string, ui: boolean, hl: IHighlight}[]) => {
    highlights.forEach(({id, ui, hl}) => {
      Highlights.setHighlight(id, ui, hl);
    });
  }

  private onWin = (wins: IWindow[]) => {
    const grids = this.state.grids;
    const nextOrder = Object.values(grids).reduce((order, grid) => Math.max(order, grid.order), 1);

    wins.reverse().forEach(({ id, winid, x, y, width, height, zIndex, focusable, type, status }, i) => {
      const curr = grids[id]?.style || {};
      const order = grids[id]?.order || i + nextOrder;
      const next = {
        zIndex: status === "show" ? zIndex : -1,
        width: col2X(width),
        height: row2Y(height),
        transform: `translate(${col2X(x)}px, ${row2Y(y)}px)`,
        visibility: status === "show" ? "visible" : "hidden" as "visible" | "hidden",
      };

      this.refresh = this.refresh || (status !== "show" && zIndex < 5);
      if (status === "delete") {
        delete(grids[id]);
      } else if (JSON.stringify(curr) !== JSON.stringify(next)) {
        this.refresh = this.refresh || (zIndex < 5 && (curr.width !== next.width || curr.height !== next.height));
        grids[id] = { grid: id, winid, order, focusable, type, style: next };
      }
    });

    this.setState({ grids });
    this.refresh && Emit.send("envim:command", "mode");
    this.refresh = false;
  }

  private onOption = (options: { [k: string]: boolean }) => {
    Setting.options = options;
    "mousemoveevent" in options && this.setState({ mousemoveevent: options.mousemoveevent });
  }

  private onPause = (pause: boolean) => {
    this.setState({ pause });
  }

  private onMouseUp = () => {
    Emit.share("envim:drag", -1);
    Emit.share("envim:focus");
  }

  render() {
    return (
      <div style={this.main} onMouseUp={this.onMouseUp}>
        <TablineComponent {...this.header} />
        <FlexComponent>
          <FlexComponent color="default" grow={1} shrink={1} shadow />
          <FlexComponent style={this.editor}>
            { Object.values(this.state.grids).sort((a, b) => a.order - b.order).map(grid => (
              <EditorComponent key={grid.grid} editor={this.editor} mousemoveevent={this.state.mousemoveevent} { ...grid } />
            )) }
            <PopupmenuComponent />
            <InputComponent />
          </FlexComponent>
          <CmdlineComponent />
          <NotificateComponent />
          <FlexComponent color="default" grow={1} shrink={1} shadow />
        </FlexComponent>
        <HistoryComponent {...this.footer} />
        { this.state.pause && (
          <FlexComponent direction="column" horizontal="center" vertical="center" color="default" position="absolute" inset={[0]} style={styles.backdrop}>
            <div className="animate loading" />
          </FlexComponent>
        ) }
      </div>
    );
  }
}
