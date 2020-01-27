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
    this.height = Math.min(15, height);
    this.grid.resize(0, 0, this.width, this.height)
  }

  show(content: string[][], pos: number, prompt: string, indent: number) {
    this.grid.getLine(this.height - 1, 0, ({ row, col }) => {
      const { text, hl } = this.grid.getDefault(row, col);
      this.grid.setCell(row, col, text, hl);
    });
    this.indent = prompt.length;
    this.setLine(this.height - 1, 0, [["0", prompt]]);
    this.setLine(this.height - 1, this.indent + indent, content);

    return this.pos(pos + indent);
  }

  pos(pos: number) {
    this.cursor = pos;
    return {
      cursor: this.grid.setCursorPos(this.height - 1, this.indent + pos),
      cells: this.grid.getFlush(),
    };
  }

  specialchar(c: string, shift: boolean) {
    this.cursor += shift ? 2 : 1
    this.grid.setCell(this.height - 1, this.cursor, c, 0);
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
      this.setLine(this.height - 1 - this.blockline.length + i, this.indent, this.blockline[i]);
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
