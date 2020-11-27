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

export interface ITab {
  name: string;
  active: boolean;
  filetype: string;
  buftype: string;
  edit: boolean;
  protect: boolean;
}

export interface IMessage {
  kind: string;
  contents: { hl: number, content: string }[];
}

export interface IMode {
  name: string;
  short_name: string;
}

export interface IMenu {
  name: string;
  active: boolean;
  hidden: boolean;
  mappings: { [k: string]: { enabled: boolean; } };
  submenus?: IMenu[];
}
