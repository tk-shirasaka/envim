import React from "react";

import { Emit } from "../../utils/emit";
import { Highlights } from "../../utils/highlight";

interface Props {
}

interface States {
  line: number;
  contents: { hl: number, reverse: boolean, c: string }[][];
  pos: number;
  prompt: string;
  indent: number;
}

const position: "absolute" = "absolute";
const pointerEvents: "none" = "none";
const whiteSpace: "pre-wrap" = "pre-wrap";
const styles = {
  scope: {
    position,
    display: "flex",
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
    animation: "fadeIn .5s ease",
    borderRadius: "4px 4px 0 0",
    boxShadow: "0 0 4px 0px",
    pointerEvents,
  },
  prompt: {
    padding: 4,
  },
  cmdline: {
    padding: 4,
    whiteSpace,
  },
};

export class CmdlineComponent extends React.Component<Props, States> {

  constructor(props: Props) {
    super(props);

    this.state = { line: 0, contents: [], pos: 0, prompt: "", indent: 0 };
    Emit.on("cmdline:show", this.onCmdline.bind(this));
    Emit.on("cmdline:cursor", this.onCursor.bind(this));
    Emit.on("cmdline:special", this.onSpecial.bind(this));
    Emit.on("cmdline:contents", this.onContents.bind(this));
    Emit.on("cmdline:hide", this.offCmdline.bind(this));
  }

  componentWillUnmount() {
    Emit.clear(["cmdline:show", "cmdline:cursor", "cmdline:flush", "cmdline:hide"]);
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

  private onCmdline(content: string[][], pos: number, prompt: string, indent: number) {
    const contents = this.state.contents;
    const line = Math.max(1, this.state.line);
    pos += indent;

    contents.splice(line - 1, 1, this.convertContent(content, pos, indent));
    this.setState({ line, contents, pos, prompt, indent })
  }

  private onCursor(pos: number) {
    const contents = this.state.contents;
    pos += this.state.indent;

    contents[this.state.line - 1][this.state.pos].reverse = false;
    contents[this.state.line - 1][pos].reverse = true;
    this.setState({ contents, pos });
  }

  private onSpecial(c: string, shift: boolean) {
    const contents = this.state.contents;
    const pos = shift ? this.state.pos + 1 : this.state.pos;

    shift || (contents[this.state.line - 1][this.state.pos].reverse = false);
    contents[this.state.line - 1].splice(this.state.pos, 0, { hl: 0, c, reverse: true });
    this.setState({ contents, pos });
  }

  private onContents(contents: string[][][]) {
    const line = Math.max(2, this.state.line + contents.length);
    this.setState({ line, contents: [...contents.map(content => this.convertContent(content, -1, 0)), ...this.state.contents] });
  }

  private offCmdline() {
    this.state.line && this.setState({ line: 0, contents: [] });
  }

  private getScopeStyle() {
    return { ...styles.scope, ...this.props, ...Highlights.style(0) };
  }

  render() {
    return this.state.line === 0 ? null : (
      <div style={this.getScopeStyle()}>
        <div className="bold color-lightblue" style={styles.prompt}>{ this.state.prompt }</div>
        <div style={styles.cmdline}>
          {this.state.contents.map((content, i) =>
            <div key={i}>
              {content.map(({hl, reverse, c}, j) => (hl || reverse) ? <span style={Highlights.style(hl, reverse)} key={`${i}.${j}`}>{ c }</span> : c)}
            </div>
          )}
        </div>
      </div>
    );
  }
}
