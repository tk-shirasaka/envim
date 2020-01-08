import { ipcMain, IpcMainEvent } from "electron";
import { spawn } from "child_process";

export class Setting {
  private isWin: boolean = process.platform === "win32";

  constructor() {
    ipcMain.on("setting:command", this.onCommand.bind(this));
  }

  private decodeLists(buffer: Buffer) {
    return Buffer.from(buffer).toString("utf-8").replace(/\/\//g, "/").split("\n");
  }

  private onCommand(e: IpcMainEvent, command: string) {
    if (this.isWin) {
      e.sender.send("setting:command-list", []);
    } else {

      spawn("find", [command, "-maxdepth", "1"])
        .stdout.on("data", lines => e.sender.send("setting:command-list", this.decodeLists(lines)));
    }
  }
}
