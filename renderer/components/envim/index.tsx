import React from "react";

import { ISetting, IWindow, IHighlight } from "common/interface";

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
  header: { width: number; height: number; paddingLeft: number };
  main: { width: number; height: number; };
  footer: { width: number; height: number; };
}

interface States {
  pause: boolean;
  mousemoveevent: boolean;
  grids: { [k: string]: {
    id: string;
    gid: number;
    winid: number;
    order: number;
    focusable: boolean;
    focus: boolean
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
    opacity: 0.2,
    cursor: "wait",
  }
};

export class EnvimComponent extends React.Component<Props, States> {
  private refresh: boolean = false;

  constructor(props: Props) {
    super(props);

    this.state = { pause: false, mousemoveevent: false, grids: {} };
    Emit.on("app:switch", this.onSwitch);
    Emit.on("highlight:set", this.onHighlight);
    Emit.on("win:pos", this.onWin);
    Emit.on("option:set", this.onOption);
    Emit.on("envim:setting", this.onSetting);
    Emit.on("envim:pause", this.onPause);
    Emit.send("envim:attach", x2Col(this.props.main.width), y2Row(this.props.main.height), Setting.options);
  }

  componentDidUpdate({ main }: Props) {
    if (this.props.main.width === main.width && this.props.main.height === main.height) return

    Emit.send("envim:resize", 0, x2Col(this.props.main.width), y2Row(this.props.main.height));
  }

  componentWillUnmount = () => {
    Emit.off("app:switch", this.onSwitch);
    Emit.off("highlight:set", this.onHighlight);
    Emit.off("win:pos", this.onWin);
    Emit.off("option:set", this.onOption);
    Emit.off("envim:setting", this.onSetting);
    Emit.off("envim:pause", this.onPause);
  }

  private onSwitch = () => {
    Emit.send("envim:attach", x2Col(this.props.main.width), y2Row(this.props.main.height), Setting.options);
  }

  private onHighlight = (highlights: {id: string, ui: boolean, hl: IHighlight}[]) => {
    highlights.forEach(({id, ui, hl}) => {
      Highlights.setHighlight(id, ui, hl);
    });
  }

  private onWin = (workspace: string, wins: IWindow[]) => {
    this.setState(() => {
      const grids = this.state.grids;
      const nextOrder = Object.values(grids).reduce((order, grid) => Math.max(order, grid.order), 1);

      Object.values(grids).forEach(grid => grid.id.indexOf(`${workspace}.`) < 0 && (grid.style.visibility = "hidden"));
      wins.reverse().forEach(({ id, gid, winid, x, y, width, height, zIndex, focusable, focus, type, status }, i) => {
        const curr = grids[id]?.style || {};
        const order = grids[id]?.order || i + nextOrder;
        const next = {
          zIndex: (status === "show" ? zIndex : -1) + +focus ,
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
          grids[id] = { id, gid, winid, order, focusable, focus, type, style: next };
        }
      });

      this.refresh && Emit.send("envim:command", "mode");
      this.refresh = false;
      Emit.share("envim:focus");

      return { grids };
    });
  }

  private onOption = (options: ISetting["options"]) => {
    Setting.options = options;
    "mousemoveevent" in options && this.setState(() => ({ mousemoveevent: options.mousemoveevent }));
  }

  private onSetting = (setting: ISetting) => {
    Setting.searchengines = setting.searchengines;
  }

  private onPause = (pause: boolean) => {
    this.setState(() => ({ pause }));
  }

  private onMouseUp = () => {
    Emit.share("envim:drag", "");
    Emit.share("envim:focus");
  }

  render() {
    const { size, height } = Setting.font;

    return (
      <div style={{fontSize: size, lineHeight: `${height}px`}} onMouseUp={this.onMouseUp}>
        <TablineComponent {...this.props.header} />
        <FlexComponent zIndex={0}>
          <FlexComponent color="default" zIndex={-1} grow={1} shrink={1} />
          <FlexComponent zIndex={0} direction="column" overflow="visible">
            <div className="color-default" style={{height: Setting.font.height}} />
            <FlexComponent overflow="visible" style={this.props.main}>
              { Object.values(this.state.grids).sort((a, b) => a.order - b.order).map(grid => (
                <EditorComponent key={grid.id} mousemoveevent={this.state.mousemoveevent} { ...grid } />
              )) }
              <PopupmenuComponent />
              <InputComponent />
            </FlexComponent>
          </FlexComponent>
          <CmdlineComponent />
          <NotificateComponent />
          <FlexComponent color="default" zIndex={-1} grow={1} shrink={1} />
        </FlexComponent>
        <HistoryComponent {...this.props.footer} />
        { this.state.pause && (
          <FlexComponent direction="column" horizontal="center" vertical="center" color="default" position="absolute" zIndex={100} inset={[0]} style={styles.backdrop}>
            <div className="animate loading" />
          </FlexComponent>
        ) }
      </div>
    );
  }
}
