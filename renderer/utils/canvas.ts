import { ICell, IScroll } from "common/interface";

import { Context2D } from "./context2d";

export class Canvas {
  private static renderer: { [k: number]: Context2D} = {};
  private static init = false;

  static set(
    grid: number,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    lighten: boolean,
  ) {
    Canvas.init || Canvas.render();
    Canvas.init = true;
    Canvas.renderer[grid] = new Context2D(canvas, ctx, lighten);
  }

  static delete(grid: number) {
    delete(Canvas.renderer[grid]);
  }

  static clear(grid: number, width: number, height: number) {
    Canvas.renderer[grid]?.clear(0, 0, width, height);
  }

  static getCapture(grid: number) {
    return Canvas.renderer[grid]?.getCapture();
  }

  static putCapture(grid: number, capture: HTMLCanvasElement) {
    Canvas.renderer[grid]?.putCapture(capture, 0, 0)
  }

  static update(grid: number, cells: ICell[], scroll: IScroll | undefined) {
    Canvas.renderer[grid]?.push(cells, scroll)
  }

  private static render() {
    Object.values(Canvas.renderer).forEach(renderer => renderer.render());
    requestAnimationFrame(Canvas.render);
  }
}
