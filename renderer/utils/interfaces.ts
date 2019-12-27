export interface IFont {
  width: number;
  height: number;
};

export class Font implements IFont {
  constructor(
    public width = 8,
    public height = 16,
  ) { }
}
