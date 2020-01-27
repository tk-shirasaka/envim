import { Localstorage } from "./localstorage";

interface IFont {
  size: number;
  width: number;
  height: number;
}

export const font: Localstorage<IFont> = new Localstorage<IFont>("font", { size: 16, width: 8, height: 17 });
