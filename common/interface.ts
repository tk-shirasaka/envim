export interface ICell {
  row: number;
  col: number;
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

export interface IMessage {
  group: number;
  kind: string;
  contents: { hl: number, content: string }[];
}
