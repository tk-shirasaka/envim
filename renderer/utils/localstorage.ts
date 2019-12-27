export class Localstorage<T> {
  private key: string;
  private item: T;

  constructor(key: string, init: T) {
    const item = localStorage.getItem(key);

    this.key = key;
    this.item = item ? JSON.parse(item) : init;
  }

  get() {
    return this.item;
  }

  set(item: T) {
    this.item = item;
    localStorage.setItem(this.key, JSON.stringify(this.item));
  }
}
