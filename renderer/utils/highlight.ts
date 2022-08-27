import { IHighlight } from "common/interface";
import { Setting } from "./setting";

interface IOptions {
  reverse?: boolean;
  normal?: boolean;
  lighten?: boolean;
};

class Highlight {
  public foreground: { normal: string; alpha: string; lighten: string; };
  public background: { normal: string; alpha: string; lighten: string; };
  public special: { normal: string; alpha: string; lighten: string; };
  public reverse?: boolean;
  private type: "normal" | "bold" | "italic";
  private decorate: "none" | "strikethrough" | "underline" | "underdouble" | "undercurl" | "underdotted" | "underdashed";

  constructor(highlight: IHighlight, alpha: number, lighten: number) {
    alpha = highlight.blend === undefined ? alpha : highlight.blend;
    alpha = (100 - alpha) / 100;
    lighten = (100 - lighten) / 100;

    this.background = this.intToColor(highlight.background, alpha, lighten);
    this.foreground = this.intToColor(highlight.foreground, alpha, lighten);
    this.special = this.intToColor(highlight.special, alpha, lighten);
    this.reverse = highlight.reverse;

    this.type = "normal";
    if (highlight.bold) this.type = "bold";
    if (highlight.italic) this.type = "italic";

    this.decorate = "none";
    if (highlight.strikethrough) this.decorate = "strikethrough";
    if (highlight.underline) this.decorate = "underline";
    if (highlight.underdouble) this.decorate = "underdouble";
    if (highlight.undercurl) this.decorate = "undercurl";
    if (highlight.underdotted) this.decorate = "underdotted";
    if (highlight.underdashed) this.decorate = "underdashed";
  }

  private intToColor(color: number | undefined, a1: number, a2: number) {
    if (color === undefined || color < 0) return { normal: "", alpha: "", lighten: "" };

    const rgb = `${("000000" + color.toString(16)).slice(-6)}`;

    const r = Number(`0x${rgb[0]}${rgb[1]}`)
    const g = Number(`0x${rgb[2]}${rgb[3]}`)
    const b = Number(`0x${rgb[4]}${rgb[5]}`)

    return {
      normal: `#${rgb}`,
      alpha: `rgba(${r}, ${g}, ${b}, ${a1})`,
      lighten: `rgba(${r}, ${g}, ${b}, ${a2})`,
    };
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
    const alpha = ui ? Setting.opacity : 0;
    const lighten = alpha && Setting.options.ext_multigrid ? Math.sqrt(alpha / 100) * 100 : alpha;

    Highlights.hls[id] = new Highlight(hl, alpha, lighten);
  }

  static color(id: string, type: "foreground" | "background" | "special", options: IOptions = {}) {
    const alpha = type === "background" && !options.normal ? "alpha" : "normal";
    const reverse = Highlights.hls[id]?.reverse ? !options.reverse : options.reverse;

    if (reverse && type !== "special") {
      type = type === "foreground" ? "background" : "foreground";
    }

    const color1 = Highlights.hls[0] && Highlights.hls[0][type];
    const color2 = Highlights.hls[id] && Highlights.hls[id][type] || color1;

    if (options.lighten && type === "background") {
      return color2.lighten || color1.lighten;
    }

    return color2[alpha] || color1[alpha];
  }

  static style(id: string, options: IOptions = {}) {
    const background = Highlights.color(id, "background", options);
    const foreground = Highlights.color(id, "foreground", options);
    const special = Highlights.color(id, "special");
    const fontFamily = Highlights.fontFamily(id);
    const fontStyle = Highlights.fontStyle(id);
    const textDecoration = {
      none: "",
      strikethrough: `line-through ${special}`,
      underline: `underline solid ${special}`,
      underdouble: `underline double ${special}`,
      undercurl: `underline wavy ${special}`,
      underdotted: `underline dotted ${special}`,
      underdashed: `underline dashed ${special}`,

    }[Highlights.decoration(id)];

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
