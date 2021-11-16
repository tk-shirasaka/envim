import { IHighlight } from "common/interface";
import { Setting } from "./setting";

class Highlight {
  public foreground: { normal: string; alpha: string; };
  public background: { normal: string; alpha: string; };
  public special: { normal: string; alpha: string; };
  public reverse?: boolean;
  private type: "normal" | "bold" | "italic";
  private decorate: "none" | "strikethrough" | "underline" | "undercurl";

  constructor(highlight: IHighlight, alpha: number) {
    alpha = highlight.blend === undefined ? alpha : highlight.blend;
    alpha = (100 - alpha) / 100;

    this.background = this.intToColor(highlight.background, alpha);
    this.foreground = this.intToColor(highlight.foreground, alpha);
    this.special = this.intToColor(highlight.special, alpha);
    this.reverse = highlight.reverse;

    this.type = "normal";
    if (highlight.bold) this.type = "bold";
    if (highlight.italic) this.type = "italic";

    this.decorate = "none";
    if (highlight.strikethrough) this.decorate = "strikethrough";
    if (highlight.underline) this.decorate = "underline";
    if (highlight.undercurl) this.decorate = "undercurl";
  }

  private intToColor(color: number | undefined, a: number) {
    if (color === undefined || color < 0) return { normal: "", alpha: "" };

    const rgb = `${("000000" + color.toString(16)).slice(-6)}`;

    const r = Number(`0x${rgb[0]}${rgb[1]}`)
    const g = Number(`0x${rgb[2]}${rgb[3]}`)
    const b = Number(`0x${rgb[4]}${rgb[5]}`)

    return { normal: `#${rgb}` , alpha: `rgba(${r}, ${g}, ${b}, ${a})` };
  }

  font(size: number) {
    return `${this.fontStyle()} ${size}px ${this.fontFamily(true)}`;
  }

  fontFamily(editor: boolean) {
    return (editor ? "Editor " : "") + { normal: "Regular", bold: "Bold", italic:"Regular" }[this.type];
  }

  fontStyle() {
    return this.type === "italic" ? "italic" : "";
  }

  decoration() {
    return this.decorate;
  }
}

export class Highlights {
  private static hls: { [k: string]: Highlight } = {};

  static setHighlight(id: string, ui: boolean, hl: IHighlight) {
    const multiple = Setting.options.ext_multigrid ? 1 : 2;
    const alpha = ui ? Math.sqrt((Setting.opacity / 100) ** multiple) * 100 : 0;

    Highlights.hls[id] = new Highlight(hl, alpha);
  }

  static color(id: string, type: "foreground" | "background" | "special", reverse: boolean = false) {
    const alpha = type === "background" ? "alpha" : "normal";
    reverse = Highlights.hls[id]?.reverse ? !reverse : reverse;

    if (reverse && type !== "special") {
      type = type === "foreground" ? "background" : "foreground";
    }

    if (Highlights.hls[id] && Highlights.hls[id][type][alpha]) return Highlights.hls[id][type][alpha];
    if (Highlights.hls[0] && Highlights.hls[0][type][alpha]) return Highlights.hls[0][type][alpha];
    if (Highlights.hls[-1] && Highlights.hls[-1][type][alpha]) return Highlights.hls[-1][type][alpha];

    return "rgba(0, 0, 0, 1)";
  }

  static style(id: string, reverse: boolean = false) {
    const background = Highlights.color(id, "background", reverse);
    const foreground = Highlights.color(id, "foreground", reverse);
    const special = Highlights.color(id, "special");
    const fontFamily = Highlights.fontFamily(id);
    const fontStyle = Highlights.fontStyle(id);
    const textDecoration = { none: "", strikethrough: `line-through ${special}`, underline: `underline ${special}`, undercurl: `underline wavy ${special}`}[Highlights.decoration(id)];

    return { background, color: foreground, borderColor: foreground, fontFamily, fontStyle, textDecoration };
  }

  static font(id: string, size: number) {
    return Highlights.hls[id]?.font(size) || "";
  }

  static fontFamily(id: string) {
    return Highlights.hls[id]?.fontFamily(false) || "";
  }

  static fontStyle(id: string) {
    return Highlights.hls[id]?.fontStyle() || "";
  }

  static decoration(id: string) {
    return Highlights.hls[id]?.decoration() || "none";
  }
}
