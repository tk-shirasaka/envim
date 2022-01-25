import React from "react";

import { Emit } from "../../utils/emit";
import { Highlights } from "../../utils/highlight";
import { Setting } from "../../utils/setting";

import { FlexComponent } from "../flex";

interface Props {
}

interface States {
  cmdline: { hl: string, reverse: boolean, c: string }[];
  contents: { hl: string, reverse: boolean, c: string }[][];
  pos: number;
  prompt: string;
  indent: number;
}

const pointerEvents: "none" = "none";
const styles = {
  scope: {
    zIndex: 20,
    left: "10%",
    right: "10%",
    pointerEvents,
  },
};

export class CmdlineComponent extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);

    this.state = { cmdline: [], contents: [], pos: 0, prompt: "", indent: 0 };
    Emit.on("cmdline:show", this.onCmdline);
    Emit.on("cmdline:cursor", this.onCursor);
    Emit.on("cmdline:special", this.onSpecial);
    Emit.on("cmdline:blockshow", this.onBlock);
    Emit.on("cmdline:blockhide", this.offBlock);
  }

  componentWillUnmount() {
    Emit.clear(["cmdline:show", "cmdline:cursor", "cmdline:special", "cmdline:blockshow", "cmdline:blockhide"]);
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
      result.push({ hl: "0", reverse: false, c: " " });
    }
    content.forEach(([hl, text]) => {
      result = result.concat(text.split("").map(c => ({ hl, reverse: false, c })))
    });
    content.length && result.push({ hl: "0", reverse: false, c: " " });

    return result;
  }

  private onCmdline = (cmd: string[][], pos: number, prompt: string, indent: number) => {
    const cmdline = this.convertContent(cmd, indent)

    if (cmdline.length) {
      pos = this.getPos(cmdline, pos + indent);
      cmdline[pos].reverse = true;
    }

    this.setState({ cmdline, pos, prompt, indent })
  }

  private onCursor = (pos: number) => {
    const cmdline = this.state.cmdline;
    pos = this.getPos(cmdline, pos + this.state.indent);

    cmdline[this.state.pos].reverse = false;
    cmdline[pos].reverse = true;
    this.setState({ cmdline, pos });
  }

  private onSpecial = (c: string, shift: boolean) => {
    const cmdline = this.state.cmdline;
    const pos = shift ? this.state.pos + 1 : this.state.pos;

    shift || (cmdline[this.state.pos].reverse = false);
    cmdline.splice(this.state.pos, 0, { hl: "0", c, reverse: true });
    this.setState({ cmdline, pos });
  }

  private onBlock = (lines: string[][][]) => {
    const contents = [
      ...this.state.contents,
      ...lines.map(line => this.convertContent(line, 0)),
    ];
    this.setState({ contents });
  }

  private offBlock = () => {
    this.setState({ contents: [], cmdline: [] });
  }

  private getScopeStyle() {
    const { height } = Setting.font;
    return { padding: height, ...Highlights.style("0"), ...styles.scope };
  }

  private renderCmdline(cmdline: States["cmdline"]) {
    return cmdline.map(({hl, reverse, c}, i) => {
      c = c.charCodeAt(0) < 0x20 ? `^${String.fromCharCode(c.charCodeAt(0) + 0x40)}` : c;
      return (hl || reverse) ? <div className="inline-block" style={Highlights.style(hl, { reverse })} key={i}>{ c }</div> : c;
    });
  }

  render() {
    return this.state.cmdline.length > 0 && (
      <FlexComponent animate="slide-down" position="absolute" whiteSpace="pre-wrap" rounded={[0, 0, 4, 4]} style={this.getScopeStyle()} shadow>
        <div className="bold">{ this.state.prompt }</div>
        <div>
          {this.state.contents.map((content, i) => <div key={i}>{ this.renderCmdline(content) }</div>)}
          <div>{ this.renderCmdline(this.state.cmdline) }</div>
        </div>
      </FlexComponent>
    );
  }
}
