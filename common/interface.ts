export interface ICell {
  row: number;
  col: number;
  y: number;
  x: number;
  text: string;
  hl: number;
  width: number;
}

export interface IHighlight {
  foreground?: number,
  background?: number,
  special?: number,
  reverse?: boolean,
  italic?: boolean,
  bold?: boolean,
  strikethrough?: boolean,
  underline?: boolean,
  undercurl?: boolean,
  blend?: number,
}
