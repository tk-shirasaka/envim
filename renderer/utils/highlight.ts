import { IHighlight } from "common/interface";
import { Setting } from "./setting";

class Highlight {
  public name: string = "";
  public foreground: string = "";
  public background: string = "";
  public special: string = "";
  private type: "normal" | "bold" | "italic";
  private decorate: "none" | "strikethrough" | "underline" | "undercurl";

  constructor(highlight: IHighlight) {
    const alpha = (100 - Setting.opacity) / 100;

    if (highlight.reverse) {
      highlight.foreground === undefined || (this.background = this.intToColor(highlight.foreground, alpha));
      highlight.background === undefined || (this.foreground = this.intToColor(highlight.background, 1));
    } else {
      highlight.foreground === undefined || (this.foreground = this.intToColor(highlight.foreground, 1));
      highlight.background === undefined || (this.background = this.intToColor(highlight.background, alpha));
    }
    highlight.special === undefined ||  (this.special = this.intToColor(highlight.special, 1));

    this.type = "normal";
    if (highlight.bold) this.type = "bold";
    if (highlight.italic) this.type = "italic";

    this.decorate = "none";
    if (highlight.strikethrough) this.decorate = "strikethrough";
    if (highlight.underline) this.decorate = "underline";
    if (highlight.undercurl) this.decorate = "undercurl";
  }

  private intToColor(color: number, a: number) {
    const rgb = `${("000000" + color.toString(16)).slice(-6)}`;

    const r = Number(`0x${rgb[0]}${rgb[1]}`)
    const g = Number(`0x${rgb[2]}${rgb[3]}`)
    const b = Number(`0x${rgb[4]}${rgb[5]}`)

    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  font(size: number) {
    return {
      normal: `${size}px Ricty Diminished, Nerd Font`,
      bold: `bold ${size}px Ricty Diminished, Nerd Font`,
      italic:`italic ${size}px Ricty Diminished, Nerd Font`,
    }[this.type];
  }

  decoration() {
    return ["underline", "undercurl"].indexOf(this.decorate) >= 0;
  }
}

export class Highlights {
  private static hls: { [k: number]: Highlight } = {};

  static setHighlight(id: number, hl: IHighlight) {
    Highlights.hls[id] = new Highlight(hl);
  }

  static setName(id: number, name: string) {
    Highlights.hls[id].name = name;
  }

  static color(id: number, type: "foreground" | "background" | "special") {
    return Highlights.hls[id][type] || Highlights.hls[0][type];
  }

  static style(id: number, reverse: boolean = false) {
    const background = Highlights.color(id, reverse ? "foreground" : "background");
    const foreground = Highlights.color(id, reverse ? "background" : "foreground");

    return { background, color: foreground, borderColor: foreground };
  }

  static font(id: number, size: number) {
    return Highlights.hls[id].font(size);
  }

  static decoration(id: number) {
    return Highlights.hls[id].decoration();
  }
}
