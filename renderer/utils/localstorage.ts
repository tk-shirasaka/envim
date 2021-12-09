export class Localstorage<T> {
  private key: string;
  private item: T;

  constructor(key: string, init: T) {
    const item = localStorage.getItem(key);

    this.key = key;
    this.item = this.deepcopy(init, item ? JSON.parse(item) : {});
  }

  private deepcopy(s: any, t: any) {
    if (s instanceof Array) {
      s = t instanceof Array && t.length > 0 ? t : s;
    } else if (s instanceof Object) {
      Object.keys(s).forEach(k => {
        s[k] = t instanceof Object && k in t ? this.deepcopy(s[k], t[k]) : s[k];
      });
    } else {
      return t;
    }

    return s;
  }

  get() {
    return this.item;
  }

  set(item: T) {
    this.item = this.deepcopy(this.item, item);
    localStorage.setItem(this.key, JSON.stringify(this.item));
  }
}
