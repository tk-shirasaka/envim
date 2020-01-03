import { IFont } from "./interfaces";

export class Context2D {
  private x = 0;
  private y = 0;
  private fg = 0;
  private bg = 0;
  private special = -1;
  private defaultFg = 0;
  private defaultBg = 0;
  private region = { top: 0, bottom: 0, left: 0, right: 0 };

  constructor(
    private canvas: HTMLCanvasElement,
    private ctx: CanvasRenderingContext2D,
    private win: { width: number; height: number; },
    private font: IFont,
  ) { }

  cursor(row: number, col: number) {
    const [y, x] = [row * this.font.height, col * this.font.width];
    if (x < this.win.width && y < this.win.height) {
      [this.x, this.y] = [x, y];
    }
  }

  resize(x: number, y: number) {
    this.win.width = x * this.font.width;
    this.win.height = y * this.font.height;
  }

  highlight(fg: number, bg: number, special: number, reverse: boolean, bold: boolean, italic: boolean) {
    this.fontStyle();
    this.fg = fg || this.defaultFg;
    this.bg = bg || this.defaultBg;
    this.special = special || -1;
    reverse && ([this.fg, this.bg] = [this.bg, this.fg]);
    bold && (this.fontStyle("bold"));
    italic && (this.fontStyle("italic"));
  }

  update(color: number, type: "fg" | "bg") {
    type === "fg" && ([this.fg, this.defaultFg] = [color, color])
    type === "bg" && ([this.bg, this.defaultBg] = [color, color])
  }

  fontStyle(type: "normal" | "bold" | "italic" = "normal") {
    this.ctx.textBaseline = "top";
    type === "normal" && (this.ctx.font = `${this.font.height}px Ricty Diminished, Nerd Font`);
    type === "bold" && (this.ctx.font = `${this.font.height}px Ricty Diminished Bold, Nerd Font Bold`);
    type === "italic" && (this.ctx.font = `${this.font.height}px Ricty Diminished Oblique`);
  }

  clear(col: number) {
    this.ctx.clearRect(this.x, this.y, col * this.font.width, this.font.height);
  }

  clearEol() {
    const col = Math.floor((this.win.width - this.x) / this.font.width);
    this.rect(col, true);
  }

  clearAll() {
    this.style(this.defaultBg);
    this.ctx.clearRect(0, 0, this.win.width, this.win.height);
    this.ctx.fillRect(0, 0, this.win.width, this.win.height);
  }

  capture(type: "cursor" | "win") {
    const [x, y, w, h] = type === "cursor"
      ? [this.x, this.y, this.font.width, this.font.height]
      : [0, 0, this.win.width, this.win.height];

    return this.ctx.getImageData(x, y, w, h);
  }

  restore(capture: ImageData, type: "cursor" | "win") {
    const [x, y] = type === "cursor" ? [this.x, this.y] : [0, 0];
    this.ctx.putImageData(capture, x, y);
  }

  reverse() {
    const src = this.capture("cursor");
    const dst = this.ctx.createImageData(this.font.width, this.font.height);
    for (let i = 0; i < src.data.length; i += 4) {
      dst.data[i] = 255 - src.data[i];
      dst.data[i + 1] = 255 - src.data[i + 1];
      dst.data[i + 2] = 255 - src.data[i + 2];
      dst.data[i + 3] = src.data[i + 3];
    }
    this.restore(dst, "cursor");
  }

  scrollRegion(top: number, bottom: number, left: number, right: number) {
    [top, bottom] = [top * this.font.height, (bottom + 1) * this.font.height];
    [left, right] = [left * this.font.width, right * this.font.width];
    this.region = { top, bottom, left, right };
  }

  scroll(row: number) {
    const offset = this.font.height * row;
    const [x, w, h] = [this.region.left, this.region.right - this.region.left, this.region.bottom - this.region.top - Math.abs(offset)];
    const sy = Math.max(this.region.top, this.region.top + offset);
    const dy = Math.max(this.region.top, this.region.top - offset);
    this.ctx.drawImage(this.canvas, x, sy, w, h, x, dy, w, h);
  }

  style(color: number) {
    this.ctx.fillStyle = `#${color.toString(16)}`;
  }

  rect(col: number, isDefault: boolean = false) {
    this.clear(col);
    this.style(isDefault ? this.defaultBg : this.bg);
    this.ctx.fillRect(this.x, this.y, col * this.font.width, this.font.height);
  }

  underline(col: number) {
    if (this.special >= 0) {
      this.ctx.save();
      this.ctx.strokeStyle = `#${this.special.toString(16)}`;
      this.ctx.beginPath();
      this.ctx.moveTo(this.x, this.y + this.font.height - 1);
      this.ctx.lineTo(this.x + col * this.font.width, this.y + this.font.height - 1);
      this.ctx.closePath();
      this.ctx.stroke()
      this.ctx.restore();
    }

    this.special = -1;
  }

  text(text: string[], stay: boolean = false) {
    if (stay) {
      this.rect(text.length * 2, true);
      this.style(this.defaultFg);
      this.ctx.fillText(text.join(""), this.x, this.y);
    } else {
      this.rect(text.length);
      this.underline(text.length);
      this.style(this.fg);
      text.forEach(c => {
        this.ctx.fillText(c, this.x, this.y);
        this.x += this.font.width;
      });
    }
  }
}
