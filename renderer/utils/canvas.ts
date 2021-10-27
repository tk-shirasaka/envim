import { ICell, IScroll } from "common/interface";

import { Context2D } from "./context2d";

export class Canvas {
  private static renderer: { [k: number]: Context2D} = {};
  private static init = false;

  static set(
    grid: number,
    bg: CanvasRenderingContext2D,
    fg: CanvasRenderingContext2D,
    sp: CanvasRenderingContext2D,
  ) {
    Canvas.init || Canvas.render();
    Canvas.init = true;
    Canvas.renderer[grid] = new Context2D(bg, fg, sp);
  }

  static delete(grid: number) {
    delete(Canvas.renderer[grid]);
  }

  static clear(grid: number, width: number, height: number) {
    Canvas.renderer[grid]?.clear(0, 0, width, height);
  }

  static getCapture(grid: number, width: number, height: number) {
    return Canvas.renderer[grid]?.getCapture(0, 0, width, height);
  }

  static putCapture(grid: number, bg: ImageData, fg: ImageData, sp: ImageData) {
    Canvas.renderer[grid]?.putCapture(bg, fg, sp, 0, 0)
  }

  static update(grid: number, cells: ICell[], scroll: IScroll | undefined) {
    Canvas.renderer[grid]?.push(cells, scroll)
  }

  private static render() {
    Object.values(Canvas.renderer).forEach(renderer => renderer.render());
    requestAnimationFrame(Canvas.render);
  }
}
