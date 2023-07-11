import { readFileSync } from "fs";
import { Readable, Writable } from "stream";
import { spawn } from "child_process";
import { createConnection } from "net";
import Docker from "dockerode";
import { Client as SSHClient } from "ssh2";
import { NeovimClient } from "neovim";

export class Connect {
  private static attach(reader: Readable, writer: Writable) {
    const nvim = new NeovimClient;

    nvim.attach({ reader, writer });
    return nvim;
  }

  static command(command: string, callback: (nvim: NeovimClient) => void) {
    const { stdout, stdin } = spawn(command || "nvim", ["--embed"]);

    callback(Connect.attach(stdout, stdin));
  }

  static network(address: string, callback: (nvim: NeovimClient) => void) {
    const [port, host] = address.split(":").reverse();
    const socket = createConnection({ port: +port, host: host });

    socket.setNoDelay();
    callback(Connect.attach(socket, socket));
  }

  static docker(id: string, callback: (nvim: NeovimClient) => void) {
    const docker = new Docker;
    const container = docker.getContainer(id);

    container.inspect(async (_, info) => {
      info?.State.Running ||  (await container.start());

      container.exec({ Cmd: ["nvim", "--embed"], AttachStdin: true, AttachStdout: true }, (e, exec) => {
        if (e) throw e;
        if (!exec) return;

        exec.start({ hijack: true, stdin: true, Tty: true }, (e, stream) => {
          if (e) throw e;
          if (!stream) return;

          callback(Connect.attach(stream, stream));
        });
      });
    });
  }

  static ssh(uri: string, callback: (nvim: NeovimClient) => void) {
    const { protocol, hostname, port, username, password, searchParams } = new URL(uri);
    const ssh = new SSHClient;

    protocol === "ssh:" && ssh
      .on("ready", () => {
        ssh.exec("nvim --embed", {}, (e, stream) => {
          if (e) throw e;

          callback(Connect.attach(stream, stream));
          stream.on("exit", ssh.end);
        });
      })
      .on("error", ssh.end)
      .connect({
        host: hostname,
        port: +(port || 22),
        username,
        password,
        privateKey: searchParams.has("key") ? readFileSync(searchParams.get("key") || "") : "",
        passphrase: searchParams.get("pass") || "",
      });
  }
}
