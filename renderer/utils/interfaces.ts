export interface IFont {
  size: number;
  width: number;
  height: number;
};

export class Font implements IFont {
  constructor(
    public size = 16,
    public width = 8,
    public height = 17,
  ) { }
}
