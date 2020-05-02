import { IHighlight } from "common/interface";

class Highlight {
  public name: string = "";
  public foreground: string = "";
  public background: string = "";
  public special: string = "";
  public reverse: boolean = false;
  private type: "normal" | "bold" | "italic";
  private decorate: "none" | "strikethrough" | "underline" | "undercurl";

  public blend: number;

  constructor(highlight: IHighlight) {
    if (highlight.reverse) {
      highlight.foreground === undefined || (this.background = this.intToColor(highlight.foreground));
      highlight.background === undefined || (this.foreground = this.intToColor(highlight.background));
    } else {
      highlight.foreground === undefined || (this.foreground = this.intToColor(highlight.foreground));
      highlight.background === undefined || (this.background = this.intToColor(highlight.background));
    }
    highlight.special === undefined ||  (this.special = this.intToColor(highlight.special));
    highlight.reverse && (this.reverse = true);

    this.type = "normal";
    if (highlight.bold) this.type = "bold";
    if (highlight.italic) this.type = "italic";

    this.decorate = "none";
    if (highlight.strikethrough) this.decorate = "strikethrough";
    if (highlight.underline) this.decorate = "underline";
    if (highlight.undercurl) this.decorate = "undercurl";

    this.blend = highlight.blend || 0;
  }

  private intToColor(color: number) {
    return `#${("000000" + color.toString(16)).slice(-6)}`;
  }

  font() {
    return {
      normal: "Ricty Diminished, Nerd Font",
      bold: "Ricty Diminished Bold, Nerd Font Bold",
      italic: "Ricty Diminished Oblique",
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
    let color = type;

    if (Highlights.hls[id].reverse) {
      type === "foreground" && (color = "background");
      type === "background" && (color = "foreground");
    }
    return Highlights.hls[id][color] || Highlights.hls[0][color];
  }

  static style(id: number, reverse: boolean = false) {
    const background = Highlights.color(id, reverse ? "foreground" : "background");
    const foreground = Highlights.color(id, reverse ? "background" : "foreground");

    return { background, color: foreground, borderColor: foreground };
  }

  static font(id: number) {
    return Highlights.hls[id].font();
  }

  static decoration(id: number) {
    return Highlights.hls[id].decoration();
  }
}
