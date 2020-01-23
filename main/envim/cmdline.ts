import { Grid } from "./grid";

export class Cmdline {
  private blockline: string[][][] = [];
  private x: number = 0;
  private y: number = 0;
  private width: number = 0;
  private indent: number = 0;
  private cursor: number = 0;

  private grid: Grid = new Grid(0, 0, 0, 0);

  private setLine(row: number, col: number, content: string[][]) {
    content.forEach(([hl, text]) => {
      `${text} `.split("").forEach((c, i) => this.grid.setCell(row, col + i, c, +hl));
    });
  }

  resize(width: number, height: number) {
    this.blockline = [];
    this.x = Math.floor(width * 0.1);
    this.y = Math.floor(height / 3);
    this.width = Math.floor(width * 0.8);
    this.grid.resize(this.y, this.x, this.width, this.blockline.length + 1)
  }

  show(content: string[][], pos: number, prompt: string, indent: number) {
    this.indent = prompt.length + 1;
    this.setLine(this.blockline.length, 1, [["0", prompt]]);
    this.setLine(this.blockline.length, this.indent + indent, content);

    return this.pos(pos + indent);
  }

  pos(pos: number) {
    this.cursor = pos;
    return {
      cursor: this.grid.setCursorPos(this.blockline.length, this.indent + pos),
      cells: this.grid.getFlush(),
    };
  }

  specialchar(c: string, shift: boolean) {
    this.cursor += shift ? 2 : 1
    this.grid.setCell(this.blockline.length, this.cursor, c, 0);
    return this.pos(this.cursor);
  }

  hide() {
    this.grid.setCursorPos(0, 0);
    this.grid.resize(this.y, this.x, this.width, this.blockline.length + 1)
  }

  blockShow(lines: string[][][]) {
    this.blockline = this.blockline.concat(lines);
    this.grid.resize(this.y, this.x, this.width, this.blockline.length + 1)

    for (let i = 0; i < this.blockline.length; i++) {
      this.setLine(i, this.indent, this.blockline[i]);
    }
  }

  blockAppend(line: string[][]) {
    this.blockShow([line]);
  }

  blockHide() {
    this.blockline = [];
    return this.hide();
  }
}
