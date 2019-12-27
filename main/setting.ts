import { ipcMain, IpcMainEvent } from "electron";
import { spawn } from "child_process";

export class Setting {
  private isWin: boolean = process.platform === "win32";

  constructor() {
    ipcMain.on("setting:cmd", this.onCmd.bind(this));
  }

  private decodeLists(buffer: Buffer) {
    return Buffer.from(buffer).toString("utf-8").replace(/\/\//g, "/").split("\n");
  }

  private onCmd(e: IpcMainEvent, cmd: string) {
    if (this.isWin) {
      e.sender.send("setting:cmd-list", []);
    } else {

      spawn("find", [cmd, "-maxdepth", "1"])
        .stdout.on("data", lines => e.sender.send("setting:cmd-list", this.decodeLists(lines)));
    }
  }
}
