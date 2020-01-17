interface Highlight {
  foreground: number;
  background: number;
  special: number;
  reverse: boolean;
  italic: boolean;
  bold: boolean;
  strikethrough: boolean;
  underline:boolean;
  undercurl:boolean;
  blend: number;
}

export class Context2D {
  private highlights: { [k: number]: Highlight } = {};
  private cursor: { x: number, y: number, hl: number } = { x: 0, y: 0, hl: 0 };

  constructor(
    private ctx: CanvasRenderingContext2D,
    private font: { size: number; width: number; height: number; },
  ) { }

  private intToColor(color: number) {
    return `#${("000000" + color.toString(16)).slice(-6)}`;
  }

  private style(hl: number, type: "foreground" | "background") {
    const foreground = this.highlights[hl].foreground || this.highlights[0].foreground;
    const background = this.highlights[hl].background || this.highlights[0].background;
    const reverse = this.highlights[hl].reverse;

    switch (type) {
      case "foreground": return (this.ctx.fillStyle = this.intToColor(reverse ? background : foreground));
      case "background": return (this.ctx.fillStyle = this.intToColor(reverse ? foreground : background));
    }
  }

  private fontStyle(hl: number) {
    this.ctx.textBaseline = "top";
    this.ctx.font = `${this.font.size}px Ricty Diminished, Nerd Font`;
    this.highlights[hl].bold && (this.ctx.font = `${this.font.size}px Ricty Diminished Bold, Nerd Font Bold`);
    this.highlights[hl].italic && (this.ctx.font = `${this.font.size}px Ricty Diminished Oblique`);
  }

  private underline(x: number, y: number, col: number, hl: number) {
    if (this.highlights[hl].underline || this.highlights[hl].undercurl) {
      this.ctx.save();
      this.ctx.strokeStyle = this.intToColor(this.highlights[hl].special || this.highlights[0].special);
      this.ctx.beginPath();
      this.ctx.moveTo(x, y + this.font.height - 1);
      this.ctx.lineTo(x + col * this.font.width, y + this.font.height - 1);
      this.ctx.closePath();
      this.ctx.stroke()
      this.ctx.restore();
    }
  }

  private rect(x: number, y: number, col: number, hl: number, reverse: boolean) {
    this.ctx.clearRect(x, y, col * this.font.width, this.font.height);
    this.style(hl, reverse ? "foreground" : "background");
    this.ctx.fillRect(x, y, col * this.font.width, this.font.height);
  }

  setFont(font: { size: number; width: number; height: number; }) {
    this.font = font;
  }

  setHighlight(id: number, hl: Highlight) {
    this.highlights[id] = hl;
  }

  setCursor(x: number, y: number, hl: number) {
    this.cursor = { x, y, hl };
  }

  text(text: string) {
    const limit = text.length * 2;

    this.rect(this.cursor.x * this.font.width, this.cursor.y * this.font.height, limit, this.cursor.hl, true);
    this.style(this.cursor.hl, "background");
    this.ctx.fillText(text, this.cursor.x * this.font.width, this.cursor.y * this.font.height);
  }

  flush(cells: any[]) {
    cells.forEach(cell => {
      const [x, y] = [cell.x * this.font.width, cell.y * this.font.height];
      const reverse = (this.cursor.y === cell.y && this.cursor.x === cell.x);
      this.rect(x, y, cell.width, cell.hl, reverse);
      this.underline(x, y, cell.width, cell.hl);
      this.fontStyle(cell.hl);
      this.style(cell.hl, reverse ? "background" : "foreground");
      this.ctx.fillText(cell.text, x, y);
    });
  }
}
