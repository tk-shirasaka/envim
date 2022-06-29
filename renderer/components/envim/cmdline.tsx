import React from "react";

import { Emit } from "../../utils/emit";
import { Highlights } from "../../utils/highlight";
import { Setting } from "../../utils/setting";

import { FlexComponent } from "../flex";

interface Props {
}

interface States {
  cmdline: { hl: string, c: string }[];
  contents: { hl: string, c: string }[][];
  pos: number;
  prompt: string;
  indent: number;
}

const styles = {
  scope: {
    zIndex: 20,
    left: "10%",
    right: "10%",
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

  componentWillUnmount = () => {
    Emit.off("cmdline:show", this.onCmdline);
    Emit.off("cmdline:cursor", this.onCursor);
    Emit.off("cmdline:special", this.onSpecial);
    Emit.off("cmdline:blockshow", this.onBlock);
    Emit.off("cmdline:blockhide", this.offBlock);
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
      result.push({ hl: "0", c: " " });
    }
    content.forEach(([hl, text]) => {
      result = result.concat(text.split("").map(c => ({ hl, c })))
    });
    content.length && result.push({ hl: "0", c: " " });

    return result;
  }

  private onCmdline = (cmd: string[][], pos: number, prompt: string, indent: number) => {
    const cmdline = this.convertContent(cmd, indent)

    if (cmdline.length) {
      pos = this.getPos(cmdline, pos + indent);
    }

    this.setState({ cmdline, pos, prompt, indent })
  }

  private onCursor = (pos: number) => {
    const cmdline = this.state.cmdline;

    if (pos < cmdline.length) {
      pos = this.getPos(cmdline, pos + this.state.indent);

      this.setState({ pos });
    }
  }

  private onSpecial = (c: string, shift: boolean) => {
    const cmdline = this.state.cmdline;
    const pos = shift ? this.state.pos + 1 : this.state.pos;

    cmdline.splice(this.state.pos, 0, { hl: "0", c });
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

  private renderCmdline(cmdline: States["cmdline"], cursor: boolean) {
    return cmdline.map(({hl, c}, i) => {
      const reverse = cursor && i === this.state.pos;
      c = c.charCodeAt(0) < 0x20 ? `^${String.fromCharCode(c.charCodeAt(0) + 0x40)}` : c;
      return (hl || reverse) ? <div className="inline-block" style={Highlights.style(hl, { reverse })} key={i}>{ c }</div> : c;
    });
  }

  render() {
    return this.state.cmdline.length > 0 && (
      <FlexComponent animate="slide-down" position="absolute" whiteSpace="pre-wrap" rounded={[0, 0, 4, 4]} style={this.getScopeStyle()} shadow nomouse>
        <div className="bold">{ this.state.prompt }</div>
        <div>
          {this.state.contents.map((content, i) => <div key={i}>{ this.renderCmdline(content, false) }</div>)}
          <div>{ this.renderCmdline(this.state.cmdline, true) }</div>
        </div>
      </FlexComponent>
    );
  }
}
