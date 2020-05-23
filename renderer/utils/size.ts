import { Setting } from "./setting"

export const y2Row = (y: number) => {
  return Math.floor(y / Setting.font.height);
}

export const x2Col = (x: number) => {
  return Math.floor(x / Setting.font.width);
}

export const row2Y = (row: number) => {
  return row * Setting.font.height;
}

export const col2X = (col: number) => {
  return col * Setting.font.width;
}
