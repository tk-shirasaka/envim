import { ICell, IScroll } from "common/interface";

import { Context2D } from "./context2d";
import { Cache } from "./cache";

const TYPE = "renderer";

export class Canvas {
  private static init = false;

  static set(
    id: string,
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

      Cache.set<Context2D>(TYPE, id, new Context2D(canvas, ctx, bgcanvas, bgctx, lighten));
    }
  }

  static delete(id: string) {
    Cache.delete(TYPE, id);
  }

  static clear(id: string, width: number, height: number) {
    Cache.get<Context2D>(TYPE, id)?.clear(0, 0, width, height);
  }

  static getCapture(id: string) {
    return Cache.get<Context2D>(TYPE, id)?.getCapture();
  }

  static putCapture(id: string, capture: HTMLCanvasElement) {
    Cache.get<Context2D>(TYPE, id)?.putCapture(capture, 0, 0)
  }

  static update(id: string, cells: ICell[], scroll: IScroll | undefined) {
    Cache.get<Context2D>(TYPE, id)?.push(cells, scroll)
  }

  private static render() {
    Cache.each<Context2D>(TYPE, (renderer) => renderer.render());
    requestAnimationFrame(Canvas.render);
  }
}
