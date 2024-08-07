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
  enabled: boolean;
}

const styles = {
  scope: {
    left: "10%",
    right: "10%",
  },
};

export class CmdlineComponent extends React.Component<Props, States> {
  constructor(props: Props) {
    super(props);

    this.state = { cmdline: [], contents: [], pos: 0, prompt: "", indent: 0, enabled: Setting.options.ext_cmdline };
    Emit.on("cmdline:show", this.onCmdline);
    Emit.on("cmdline:cursor", this.onCursor);
    Emit.on("cmdline:special", this.onSpecial);
    Emit.on("cmdline:blockshow", this.onBlock);
    Emit.on("cmdline:blockhide", this.offBlock);
    Emit.on("option:set", this.onOption);
  }

  componentWillUnmount = () => {
    Emit.off("cmdline:show", this.onCmdline);
    Emit.off("cmdline:cursor", this.onCursor);
    Emit.off("cmdline:special", this.onSpecial);
    Emit.off("cmdline:blockshow", this.onBlock);
    Emit.off("cmdline:blockhide", this.offBlock);
    Emit.off("option:set", this.onOption);
  }

  private getPos(cmdline: States["cmdline"], pos: number) {
    let result = 0;
    for (; pos >= 0; result++) {
      pos -= encodeURIComponent(cmdline[result]?.c || " ").replace(/%../g, "x").length;
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
    this.setState(() => {
      const cmdline = this.convertContent(cmd, indent)

      if (cmdline.length) {
        pos = this.getPos(cmdline, pos + indent);
      }

      return { cmdline, pos, prompt, indent };
    });
  }

  private onCursor = (pos: number) => {
    this.setState(state => {
      if (pos < state.cmdline.length) {
        pos = this.getPos(state.cmdline, pos + state.indent);
      }
      return { pos };
    });
  }

  private onSpecial = (c: string, shift: boolean) => {
    this.setState(state => {
      const cmdline = state.cmdline;
      const pos = shift ? state.pos + 1 : state.pos;

      cmdline.splice(state.pos, 0, { hl: "0", c });

      return { cmdline, pos };
    });
  }

  private onBlock = (lines: string[][][]) => {
    this.setState(state => ({
      contents: [
        ...state.contents,
        ...lines.map(line => this.convertContent(line, 0)),
      ]
    }));
  }

  private offBlock = () => {
    this.setState(() => ({ contents: [], cmdline: [] }));
  }

  private onOption = (options: { ext_cmdline: boolean }) => {
    options.ext_cmdline === undefined || this.setState(() => ({ enabled: options.ext_cmdline }));
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
    return this.state.enabled && this.state.cmdline.length > 0 && (
      <FlexComponent animate="slide-down" position="absolute" whiteSpace="pre-wrap" rounded={[0, 0, 4, 4]} style={this.getScopeStyle()} shadow nomouse>
        <FlexComponent whiteSpace="pre-wrap" shrink={0}><div className="bold">{ this.state.prompt }</div></FlexComponent>
        <div>
          {this.state.contents.map((content, i) => <div key={i}>{ this.renderCmdline(content, false) }</div>)}
          <div>{ this.renderCmdline(this.state.cmdline, true) }</div>
        </div>
      </FlexComponent>
    );
  }
}
