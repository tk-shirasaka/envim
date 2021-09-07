import { IHighlight } from "common/interface";

export class Highlights {
  private static hls: { [k: string]: { fg: number; bg: number; sp: number; type: string; decorate: string; } } = {};

  static set(id: string, hl: IHighlight) {
    const highlight = Highlights.get("_");

    highlight.fg = hl.foreground || Highlights.hls["0"].fg;
    highlight.bg = hl.background || Highlights.hls["0"].bg;
    highlight.sp = hl.special || Highlights.hls["0"].sp;
    if (hl.bold) highlight.type = "bold";
    if (hl.italic) highlight.type = "italic";
    if (hl.strikethrough) highlight.decorate = "strikethrough";
    if (hl.underline) highlight.decorate = "underline";
    if (hl.undercurl) highlight.decorate = "undercurl";

    [ highlight.fg, highlight.bg ] = hl.reverse ? [ highlight.bg, highlight.fg ] : [ highlight.fg, highlight.bg ];

    Highlights.hls[id] = highlight
  }

  static get(id: string) {
    return Highlights.hls[id] || { fg: 0, bg: 0, sp: 0, type: "normal", decorate: "none" };
  }
}
