export class Localstorage<T> {
  private key: string;
  private item: T;

  constructor(key: string, init: T) {
    const item = localStorage.getItem(key);

    this.key = key;
    this.item = Object.assign(init, item ? JSON.parse(item) : {});
  }

  get() {
    return this.item;
  }

  set(item: T) {
    this.item = item;
    localStorage.setItem(this.key, JSON.stringify(this.item));
  }
}
