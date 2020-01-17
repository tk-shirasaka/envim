import { IHighlight } from "common/interface";

export class Highlight {
  public foreground: string = "";
  public background: string = "";
  public special: string = "";
  private type: "normal" | "bold" | "italic";
  private decorate: "none" | "strikethrough" | "underline" | "undercurl";

  public blend: number;

  constructor(highlight: IHighlight) {
    if (highlight.reverse) {
      highlight.foreground && (this.background = this.intToColor(highlight.foreground));
      highlight.background && (this.foreground = this.intToColor(highlight.background));
    } else {
      highlight.foreground && (this.foreground = this.intToColor(highlight.foreground));
      highlight.background && (this.background = this.intToColor(highlight.background));
    }
    highlight.special && (this.special = this.intToColor(highlight.special));

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

  get font() {
    return {
      normal: "Ricty Diminished, Nerd Font",
      bold: "Ricty Diminished Bold, Nerd Font Bold",
      italic: "Ricty Diminished Oblique",
    }[this.type];
  }

  get decoration() {
    return ["underline", "undercurl"].indexOf(this.decorate) >= 0;
  }
}
