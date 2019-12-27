import { IFont } from "./interfaces";

export class Context2D {
  constructor(
    private win: { width: number; height: number; },
    private font: IFont,
    private x = 0,
    private y = 0,
    private fg = 0,
    private bg = 0,
    private special = -1,
    private defaultFg = 0,
    private defaultBg = 0,
    private region = { top: 0, bottom: 0, left: 0, right: 0 },
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

  highlight(ctx: CanvasRenderingContext2D, fg: number, bg: number, special: number, reverse: boolean, bold: boolean, italic: boolean) {
    this.fontStyle(ctx);
    this.fg = fg || this.defaultFg;
    this.bg = bg || this.defaultBg;
    this.special = special || -1;
    reverse && ([this.fg, this.bg] = [this.bg, this.fg]);
    bold && (this.fontStyle(ctx, "bold"));
    italic && (this.fontStyle(ctx, "italic"));
  }

  update(color: number, type: "fg" | "bg") {
    type === "fg" && ([this.fg, this.defaultFg] = [color, color])
    type === "bg" && ([this.bg, this.defaultBg] = [color, color])
  }

  fontStyle(ctx: CanvasRenderingContext2D, type: "normal" | "bold" | "italic" = "normal") {
    ctx.textBaseline = "top";
    type === "normal" && (ctx.font = `${this.font.height}px Ricty Diminished`);
    type === "bold" && (ctx.font = `${this.font.height}px Ricty Diminished Bold`);
    type === "italic" && (ctx.font = `${this.font.height}px Ricty Diminished Oblique`);
  }

  clear(ctx: CanvasRenderingContext2D, col: number) {
    ctx.clearRect(this.x, this.y, col * this.font.width, this.font.height);
  }

  clearEol(ctx: CanvasRenderingContext2D) {
    const col = Math.floor((this.win.width - this.x) / this.font.width);
    this.rect(ctx, col, true);
  }

  clearAll(ctx: CanvasRenderingContext2D) {
    this.style(ctx, this.defaultBg);
    ctx.clearRect(0, 0, this.win.width, this.win.height);
    ctx.fillRect(0, 0, this.win.width, this.win.height);
  }

  reverse(ctx: CanvasRenderingContext2D) {
    const src = ctx.getImageData(this.x, this.y, this.font.width, this.font.height);
    const dst = ctx.createImageData(this.font.width, this.font.height);
    for (let i = 0; i < src.data.length; i += 4) {
      dst.data[i] = 255 - src.data[i];
      dst.data[i + 1] = 255 - src.data[i + 1];
      dst.data[i + 2] = 255 - src.data[i + 2];
      dst.data[i + 3] = src.data[i + 3];
    }
    ctx.putImageData(dst, this.x, this.y);
  }

  scrollRegion(top: number, bottom: number, left: number, right: number) {
    [top, bottom] = [top * this.font.height, (bottom + 1) * this.font.height];
    [left, right] = [left * this.font.width, right * this.font.width];
    this.region = { top, bottom, left, right };
  }

  scroll(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, row: number) {
    const offset = this.font.height * row;
    const [x, w, h] = [this.region.left, this.region.right - this.region.left, this.region.bottom - this.region.top - Math.abs(offset)];
    const sy = Math.max(this.region.top, this.region.top + offset);
    const dy = Math.max(this.region.top, this.region.top - offset);
    ctx.drawImage(canvas, x, sy, w, h, x, dy, w, h);
  }

  style(ctx: CanvasRenderingContext2D, color: number) {
    ctx.fillStyle = `#${color.toString(16)}`;
  }

  rect(ctx: CanvasRenderingContext2D, col: number, isDefault: boolean = false) {
    this.clear(ctx, col);
    this.style(ctx, isDefault ? this.defaultBg : this.bg);
    ctx.fillRect(this.x, this.y, col * this.font.width, this.font.height);
  }

  underline(ctx: CanvasRenderingContext2D, col: number) {
    if (this.special >= 0) {
      ctx.save();
      ctx.strokeStyle = `#${this.special.toString(16)}`;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.font.height - 1);
      ctx.lineTo(this.x + col * this.font.width, this.y + this.font.height - 1);
      ctx.closePath();
      ctx.stroke()
      ctx.restore();
    }

    this.special = -1;
  }

  text(ctx: CanvasRenderingContext2D, text: string[]) {
    this.rect(ctx, text.length);
    this.underline(ctx, text.length);
    this.style(ctx, this.fg);
    text.forEach(c => {
      ctx.fillText(c, this.x, this.y);
      this.x += this.font.width;
    });
  }
}
