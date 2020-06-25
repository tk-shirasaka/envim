import React from "react";

import { Emit } from "../../utils/emit";
import { Highlights } from "../../utils/highlight";

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
const whiteSpace: "pre-wrap" = "pre-wrap";
const wordBreak: "break-all" = "break-all";
const styles = {
  scope: {
    position,
    display: "flex",
    bottom: 0,
    width: "100%",
    overflow: "hidden",
    borderRadius: "4px 0 0 0",
    boxShadow: "8px -8px 4px 0 rgba(0, 0, 0, 0.6)",
    pointerEvents,
  },
  prompt: {
    padding: 4,
  },
  cmdline: {
    padding: 4,
    whiteSpace,
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

  private convertContent(content: string[][], pos: number, indent: number) {
    let result: { hl: number, reverse: boolean, c: string; }[] = [];
    let i = 0;

    for (; i < indent; i++) {
      result.push({ hl: 0, reverse: false, c: " " });
    }
    content.forEach(([hl, text]) => {
      result = result.concat(text.split("").map(c => ({ hl: +hl, reverse: pos === i++, c })))
    });
    result.push({ hl: 0, reverse: pos === i, c: " " });

    return result;
  }

  private onCmdline(cmdline: string[][], pos: number, prompt: string, indent: number) {
    pos += indent;

    this.setState({ cmdline: this.convertContent(cmdline, pos, indent), pos, prompt, indent })
  }

  private onCursor(pos: number) {
    const cmdline = this.state.cmdline;
    pos += this.state.indent;

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
      ...lines.map(line => this.convertContent(line, -1, 0)),
    ];
    this.setState({ contents });
  }

  private offBlock() {
    this.setState({ contents: [], cmdline: [] });
  }

  private getScopeStyle() {
    return { ...styles.scope, ...this.props, ...Highlights.style(0) };
  }

  renderCmdline(cmdline: { hl: number, reverse: boolean, c: string }[]) {
    return cmdline.map(({hl, reverse, c}, i) => {
      return (hl || reverse) ? <span style={Highlights.style(hl, reverse)} key={i}>{ c }</span> : c;
    });
  }

  render() {
    return this.state.cmdline.length > 0 && (
      <div className="animate slide-up" style={this.getScopeStyle()}>
        <div className="bold color-lightblue" style={styles.prompt}>{ this.state.prompt }</div>
        <div style={styles.cmdline}>
          {this.state.contents.map((content, i) => <div key={i}>{ this.renderCmdline(content) }</div>)}
          <div>{ this.renderCmdline(this.state.cmdline) }</div>
        </div>
      </div>
    );
  }
}
