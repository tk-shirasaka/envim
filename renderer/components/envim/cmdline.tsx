import React from "react";

import { Emit } from "../../utils/emit";
import { Highlights } from "../../utils/highlight";
import { Setting } from "../../utils/setting";

interface Props {
}

interface States {
  cmdline: { hl: number, reverse: boolean, c: string }[];
  contents: { hl: number, reverse: boolean, c: string }[][];
  pos: number;
  prompt: string;
  indent: number;
}

const position: "absolute" = "absolute";
const pointerEvents: "none" = "none";
const whiteSpace: "break-spaces" = "break-spaces";
const wordBreak: "break-all" = "break-all";
const styles = {
  scope: {
    position,
    zIndex: 10,
    display: "flex",
    left: "10%",
    right: "10%",
    overflow: "hidden",
    borderRadius: "0 0 4px 4px",
    boxShadow: "8px 8px 4px 0 rgba(0, 0, 0, 0.6)",
    pointerEvents,
    whiteSpace,
  },
  prompt: {
    paddingRight: 0,
  },
  cmdline: {
    paddingLeft: 0,
    wordBreak,
  },
};

export class CmdlineComponent extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);

    this.state = { cmdline: [], contents: [], pos: 0, prompt: "", indent: 0 };
    Emit.on("cmdline:show", this.onCmdline.bind(this));
    Emit.on("cmdline:cursor", this.onCursor.bind(this));
    Emit.on("cmdline:special", this.onSpecial.bind(this));
    Emit.on("cmdline:hide", this.offCmdline.bind(this));
    Emit.on("cmdline:blockshow", this.onBlock.bind(this));
    Emit.on("cmdline:blockhide", this.offBlock.bind(this));
  }

  componentWillUnmount() {
    Emit.clear(["cmdline:show", "cmdline:cursor", "cmdline:special", "cmdline:hide", "cmdline:blockshow", "cmdline:blockhide"]);
  }

  private getPos(cmdline: States["cmdline"], pos: number) {
    let result = 0;
    for (; pos >= 0; result++) {
      pos -= encodeURIComponent(cmdline[result].c).replace(/%../g, "x").length;
    }
    return result - 1;
  }

  private convertContent(content: string[][], indent: number) {
    let result: States["cmdline"] = [];
    let i = 0;

    for (; i < indent; i++) {
      result.push({ hl: 0, reverse: false, c: " " });
    }
    content.forEach(([hl, text]) => {
      result = result.concat(text.split("").map(c => ({ hl: +hl, reverse: false, c })))
    });
    result.push({ hl: 0, reverse: false, c: " " });

    return result;
  }

  private onCmdline(cmd: string[][], pos: number, prompt: string, indent: number) {
    const cmdline = this.convertContent(cmd, indent)

    pos = this.getPos(cmdline, pos + indent);
    cmdline[pos].reverse = true;

    this.setState({ cmdline, pos, prompt, indent })
  }

  private onCursor(pos: number) {
    const cmdline = this.state.cmdline;
    pos = this.getPos(cmdline, pos + this.state.indent);

    cmdline[this.state.pos].reverse = false;
    cmdline[pos].reverse = true;
    this.setState({ cmdline, pos });
  }

  private onSpecial(c: string, shift: boolean) {
    const cmdline = this.state.cmdline;
    const pos = shift ? this.state.pos + 1 : this.state.pos;

    shift || (cmdline[this.state.pos].reverse = false);
    cmdline.splice(this.state.pos, 0, { hl: 0, c, reverse: true });
    this.setState({ cmdline, pos });
  }

  private offCmdline() {
    this.state.contents.length || this.setState({ cmdline: [] });
  }

  private onBlock(lines: string[][][]) {
    const contents = [
      ...this.state.contents,
      ...lines.map(line => this.convertContent(line, 0)),
    ];
    this.setState({ contents });
  }

  private offBlock() {
    this.setState({ contents: [], cmdline: [] });
  }

  private getScopeStyle() {
    const { width, height } = Setting.font;
    return { top: -width, padding: width, paddingTop: height, ...styles.scope };
  }

  private getCmdlineStyle(style: object) {
    return { padding: Setting.font.width, ...Highlights.style(0), ...style };
  }

  private renderCmdline(cmdline: States["cmdline"]) {
    return cmdline.map(({hl, reverse, c}, i) => {
      c = c.charCodeAt(0) < 0x20 ? `^${String.fromCharCode(c.charCodeAt(0) + 0x40)}` : c;
      return (hl || reverse) ? <div className="inline-block" style={Highlights.style(hl, reverse)} key={i}>{ c }</div> : c;
    });
  }

  render() {
    return this.state.cmdline.length > 0 && (
      <div className="color-black animate slide-down" style={this.getScopeStyle()}>
        <div className="bold" style={this.getCmdlineStyle(styles.prompt)}>{ this.state.prompt }</div>
        <div className="space" style={this.getCmdlineStyle(styles.cmdline)}>
          {this.state.contents.map((content, i) => <div key={i}>{ this.renderCmdline(content) }</div>)}
          <div>{ this.renderCmdline(this.state.cmdline) }</div>
        </div>
      </div>
    );
  }
}
