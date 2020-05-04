import { IMessage } from "../../common/interface";

class Message {
  private messages: IMessage[] = [];

  set(group: number, kind: string, messages: string[][], replace: boolean) {
    const i = replace ? -1 : this.messages.length - 1;
    const contents = messages.map(([hl, content]) => ({ hl: +hl, content }))

    replace && this.messages.pop();

    if (contents.filter(({ content }) => content.replace(/\s/, "")).length === 0) return;
    if (group > 0 && i >= 0 && this.messages[i].kind === kind) {
      this.messages[i].contents = [...this.messages[i].contents, { hl: 0, content: "\n" }, ...contents];
    } else {
      this.messages = [...this.messages, { group, kind, contents }];
    }
  }

  clear() {
    this.messages = [];
  }

  get() {
    return this.messages;
  }
}

export class Messages {
  private messages: { [k: number]: Message } = {};

  set(group: number, kind: string, messages: string[][], replace: boolean) {
    this.messages[group] || (this.messages[group] = new Message);
    this.messages[group].set(group, kind, messages, replace);
  }

  clear(group: number) {
    this.messages[group]?.clear();
  }

  get(type: "history" | "notificate") {
    let result: IMessage[] = []
    Object.keys(this.messages).forEach(group => {
      if (type === "history" && +group > 0) return;
      if (type === "notificate" && +group === 0) return;
      result = [...result, ...this.messages[+group].get()]
    });

    return result;
  }
}
