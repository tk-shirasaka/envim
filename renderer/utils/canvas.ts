import { ICell, IScroll } from "common/interface";

import { Context2D } from "./context2d";
import { Cache } from "./cache";

const TYPE = "renderer";

export class Canvas {
  private static init = false;

  static set(
    grid: number,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    lighten: boolean,
  ) {
    Canvas.init || Canvas.render();
    Canvas.init = true;

    const bgcanvas = document.createElement("canvas");
    const bgctx = bgcanvas.getContext("2d");

    if (bgctx) {
      bgcanvas.width = canvas.width;
      bgcanvas.height = canvas.height;

      Cache.set<Context2D>(TYPE, grid, new Context2D(canvas, ctx, bgcanvas, bgctx, lighten));
    }
  }

  static delete(grid: number) {
    Cache.delete(TYPE, grid);
  }

  static clear(grid: number, width: number, height: number) {
    Cache.get<Context2D>(TYPE, grid)?.clear(0, 0, width, height);
  }

  static getCapture(grid: number) {
    return Cache.get<Context2D>(TYPE, grid)?.getCapture();
  }

  static putCapture(grid: number, capture: HTMLCanvasElement) {
    Cache.get<Context2D>(TYPE, grid)?.putCapture(capture, 0, 0)
  }

  static update(grid: number, cells: ICell[], scroll: IScroll | undefined) {
    Cache.get<Context2D>(TYPE, grid)?.push(cells, scroll)
  }

  private static render() {
    Cache.each<Context2D>(TYPE, (renderer) => renderer.render());
    requestAnimationFrame(Canvas.render);
  }
}
