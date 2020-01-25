import { Grid } from "./grid";

export class Cmdline {
  private blockline: string[][][] = [];
  private width: number = 0;
  private height: number = 0;
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
    this.width = width;
    this.height = height;
    this.grid.resize(0, 0, this.width, this.height)
  }

  show(content: string[][], pos: number, prompt: string, indent: number) {
    this.grid.getLine(this.blockline.length, 0, ({ row, col }) => {
      const { text, hl } = this.grid.getDefault(row, col);
      this.grid.setCell(row, col, text, hl);
    });
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
    this.grid.resize(0, 0, this.width, this.height)
  }

  blockShow(lines: string[][][]) {
    this.blockline = this.blockline.concat(lines);
    this.grid.resize(0, 0, this.width, this.height)

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
