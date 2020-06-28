import { IMessage } from "../../common/interface";

class Message {
  private messages: IMessage[] = [];

  set(group: string, kind: string, messages: string[][], replace: boolean) {
    const i = replace ? -1 : this.messages.length - 1;
    const contents = messages.map(([hl, content]) => ({ hl: +hl, content }))

    replace && this.messages.pop();

    if (contents.filter(({ content }) => content.replace(/\s/, "")).length === 0) return;
    if (group !== "history" && i >= 0 && this.messages[i].kind === kind) {
      this.messages[i].contents = [...this.messages[i].contents, { hl: 0, content: "\n" }, ...contents];
    } else {
      this.messages = [...this.messages, { kind, contents }];
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
  private messages: { [k: string]: Message } = {};

  set(group: string, kind: string, messages: string[][], replace: boolean) {
    this.messages[group] || (this.messages[group] = new Message);
    this.messages[group].set(group, kind, messages, replace);
  }

  clear(group: string) {
    this.messages[group]?.clear();
  }

  get(group: string) {
    return this.messages[group]?.get() || [];
  }
}
