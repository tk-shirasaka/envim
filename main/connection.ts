import { readFileSync } from "fs";
import { Readable, Writable } from "stream";
import { spawn } from "child_process";
import { createConnection } from "net";
import Docker from "dockerode";
import { Client as SSHClient } from "ssh2";
import { NeovimClient } from "neovim";

export class Connection {
  private static workspaces: { nvim: NeovimClient; bookmark: string, key: string }[] = [];
  private static current?: { nvim: NeovimClient; bookmark: string, key: string };
  private static timer: number = 0;

  private static attach(reader: Readable, writer: Writable) {
    const nvim = new NeovimClient;

    nvim.attach({ reader, writer });
    return nvim;
  }

  private static command(command: string, callback: (nvim: NeovimClient) => void) {
    const { stdout, stdin } = spawn(command || "nvim", ["--embed"]);

    callback(Connection.attach(stdout, stdin));
  }

  private static network(address: string, callback: (nvim: NeovimClient) => void) {
    const [port, host] = address.split(":").reverse();
    const socket = createConnection({ port: +port, host: host });

    socket.setNoDelay();
    callback(Connection.attach(socket, socket));
  }

  private static docker(id: string, callback: (nvim: NeovimClient) => void) {
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

          callback(Connection.attach(stream, stream));
        });
      });
    });
  }

  private static ssh(uri: string, callback: (nvim: NeovimClient) => void) {
    const { protocol, hostname, port, username, password, searchParams } = new URL(uri);
    const ssh = new SSHClient;

    protocol === "ssh:" && ssh
      .on("ready", () => {
        ssh.exec("nvim --embed", {}, (e, stream) => {
          if (e) throw e;

          callback(Connection.attach(stream, stream));
          stream.on("exit", ssh.end);
        });
      })
      .on("error", e => { throw e; })
      .connect({
        host: hostname,
        port: +(port || 22),
        username,
        password,
        privateKey: searchParams.has("key") ? readFileSync(searchParams.get("key") || "") : "",
        passphrase: searchParams.get("pass") || "",
        readyTimeout: 5000,
      });
  }

  static connect(type: string, path: string, bookmark: string, callback: (nvim: NeovimClient, init: boolean, workspace: string) => void) {
    const next = Connection.workspaces.find(workspace => !workspace.bookmark || workspace.bookmark === bookmark);
    const attach = (nvim: NeovimClient, init: boolean = true) => {
      const workspace = next?.key || { address: path }[type] || `${path}::${bookmark}`;
      const current = Connection.current;

      Connection.current = { nvim, bookmark, key: workspace };
      Connection.workspaces = Connection.workspaces.filter(workspace => workspace.nvim !== nvim);
      Connection.workspaces.push(Connection.current);

      if (next && next === current) return;
      if (current) {
        current.nvim.uiDetach();
        current.nvim.removeAllListeners("request");
        current.nvim.removeAllListeners("notification");
      }

      callback(nvim, init, workspace);
    };

    if (next) return attach(next.nvim, false);

    switch (type) {
      case "command": return Connection.command(path, attach);
      case "address": return Connection.network(path, attach);
      case "docker": return Connection.docker(path, attach);
      case "ssh": return Connection.ssh(path, attach);
    }
  }

  static disconnect(workspace: string, callback: (workspace?: { nvim: NeovimClient, bookmark: string, key: string }) => void) {
    Connection.workspaces = Connection.workspaces.filter(({ key }) => workspace !== key);

    clearTimeout(Connection.timer);
    Connection.timer = +setTimeout(() => {
      callback([ ...Connection.workspaces ].pop());
    }, 200);
  }
}
