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
  private x: number = 0;
  private y: number = 0;
  private grids: { [k: number]: { width: number, height: number } } = {};
  private highlights: { [k: number]: Highlight } = {};
  private captures: { ime?: ImageData; cursor?: ImageData; } = {};

  constructor(
    private canvas: HTMLCanvasElement,
    private ctx: CanvasRenderingContext2D,
    private win: { width: number; height: number; },
    private font: { size: number; width: number; height: number; },
  ) { }

  private calcSize(size: number, direction: "row" | "col") {
    const type: "width" | "height" = direction === "row" ? "height" : "width";
    return Math.min(this.font[type] * size, this.win[type]);
  }

  private calcPos(row: number, col: number) {
    return [ this.calcSize(row, "row"), this.calcSize(col, "col") ];
  }

  private region(left: number, top: number, right: number, bottom: number) {
    [ top, left ] = this.calcPos(top, left);
    [ bottom, right ] = this.calcPos(bottom, right);
    return [ left, top, right, bottom ];
  }

  private grid(grid: number) {
    return this.region(0, 0, this.grids[grid].width + 1, this.grids[grid].height + 1);
  }

  private intToColor(color: number) {
    return `#${("000000" + color.toString(16)).slice(-6)}`;
  }

  private style(hl: number, type: "foreground" | "background") {
    const color = this.highlights[hl][type] || this.highlights[0][type];

    this.ctx.fillStyle = this.intToColor(color);
  }

  private fontStyle(hl: number) {
    this.ctx.textBaseline = "top";
    this.ctx.font = `${this.font.size}px Ricty Diminished, Nerd Font`;
    this.highlights[hl].bold && (this.ctx.font = `${this.font.size}px Ricty Diminished Bold, Nerd Font Bold`);
    this.highlights[hl].italic && (this.ctx.font = `${this.font.size}px Ricty Diminished Oblique`);
  }

  private underline(col: number, hl: number) {
    if (this.highlights[hl].underline || this.highlights[hl].undercurl) {
      this.ctx.save();
      this.ctx.strokeStyle = this.intToColor(this.highlights[hl].special || this.highlights[0].special);
      this.ctx.beginPath();
      this.ctx.moveTo(this.x, this.y + this.font.height - 1);
      this.ctx.lineTo(this.x + col * this.font.width, this.y + this.font.height - 1);
      this.ctx.closePath();
      this.ctx.stroke()
      this.ctx.restore();
    }
  }

  private rect(col: number, hl: number) {
    this.ctx.clearRect(this.x, this.y, col * this.font.width, this.font.height);
    this.style(hl, "background");
    this.ctx.fillRect(this.x, this.y, col * this.font.width, this.font.height);
  }

  resize(win: { width: number; height: number; }, font: { size: number; width: number; height: number; }) {
    this.win = win;
    this.font = font;
  }

  text(text: string[], hl: number, stay: boolean = false) {
    if (stay) {
      this.rect(text.length * 2, 0);
      this.style(0, "foreground");
      this.ctx.fillText(text.join(""), this.x, this.y);
    } else {
      this.rect(text.length, hl);
      this.underline(text.length, hl);
      this.fontStyle(hl);
      this.style(hl, "foreground");
      text.forEach(c => {
        this.ctx.fillText(c, this.x, this.y);
        this.x += this.font.width;
      });
    }
  }

  capture(type: "cursor" | "ime") {
    this.captures[type] = this.ctx.getImageData(0, 0, this.win.width, this.win.height);
  }

  restore(type: "cursor" | "ime") {
    const capture = this.captures[type];
    delete(this.captures[type]);
    capture && this.ctx.putImageData(capture, 0, 0);
  }

  gridResize(grid: number, width: number, height: number) {
    this.grids[grid] = { width, height };
  }

  defaultColorsSet(foreground: number, background: number, special: number) {
    this.highlights[0] = {
      foreground,
      background,
      special,
      reverse: false,
      italic: false,
      bold: false,
      strikethrough: false,
      underline:false,
      undercurl:false,
      blend: 0,
    };
  }

  hlAttrDefine(id: number, rgb: Highlight) {
    this.highlights[id] = rgb;
  }

  gridLine(row: number, col: number, cells: string[][]) {
    let hl: number;

    [ this.y, this.x ] = this.calcPos(row, col);
    cells.forEach(cell => {
      cell.length > 1 && (hl = +cell[1]);
      cell[2] && (cell[0] = cell[0].repeat(+cell[2]));
      this.text(cell[0].split(""), hl ? hl : 0);
    });
  }

  gridClear(grid: number) {
    const [x, y, width, height] = this.grid(grid);
    this.ctx.clearRect(x, y, width, height);
    this.style(0, "background");
    this.ctx.fillRect(x, y, width, height);
  }

  gridDestory(grid: number) {
    delete(this.grids[grid]);
  }

  gridCursorGoto(row: number, col: number) {
    [ this.y, this.x ] = this.calcPos(row, col);
    this.capture("cursor");
    this.ctx.save();
    this.ctx.globalCompositeOperation = "exclusion";
    this.ctx.fillStyle = this.intToColor(0xffffff);
    this.ctx.fillRect(this.x, this.y, this.font.width, this.font.height);
    this.ctx.restore();
  }

  gridScroll(top: number, bottom: number, left: number, right: number, rows: number) {
    [left, top, right, bottom] = this.region(left, top, right, bottom);
    const offset = this.font.height * rows;
    const [x, w, h] = [left, right - left, bottom - top - Math.abs(offset)];
    const sy = Math.max(top, top + offset);
    const dy = Math.max(top, top - offset);
    this.ctx.drawImage(this.canvas, x, sy, w, h, x, dy, w, h);
  }
}
