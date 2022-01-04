import { IBuffer } from "common/interface";

export class Buffers {
  private static bufs: IBuffer[] = [];

  static get() {
    return Buffers.bufs;
  }

  static set(bufs: IBuffer[]) {
    Buffers.bufs = bufs;
  }
}
