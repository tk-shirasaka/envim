import { IHighlight } from "common/interface";

export class Highlights {
  private static hls: { [k: string]: { fg: number; bg: number; sp: number; } } = {};

  static set(id: string, hl: IHighlight, ui: boolean) {
    const highlight = Highlights.get(id);

    if (hl.foreground) highlight.fg = hl.foreground;
    if (hl.background) highlight.bg = hl.background;
    if (hl.special) highlight.sp = hl.special;
    if (hl.bold) highlight.fg = 0x2000000 | highlight.fg;
    if (hl.italic) highlight.fg = 0x4000000 | highlight.fg;
    if (ui) highlight.bg = 0x2000000 | highlight.bg;
    if (hl.strikethrough) highlight.sp = 0x2000000 | highlight.sp;
    if (hl.underline) highlight.sp = 0x4000000 | highlight.sp;
    if (hl.undercurl) highlight.sp = 0x8000000 | highlight.sp;

    [ highlight.fg, highlight.bg ] = hl.reverse ? [ highlight.bg, highlight.fg ] : [ highlight.fg, highlight.bg ];

    Highlights.hls[id] = highlight
  }

  static get(id: string) {
    return Highlights.hls[id] || { fg: 0x1000000, bg: 0x1000000, sp: 0x1000000 };
  }
}
