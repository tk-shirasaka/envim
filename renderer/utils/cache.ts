export class Cache {
  private static cache: { [k: string]: { [k: string | number]: any } } = {};

  static set<T>(type: string, key: string | number, item: T) {
    if (!Cache.cache[type]) Cache.cache[type] = {};
    Cache.cache[type][key] = item;
  }

  static get<T>(type: string, key: string | number): T {
    return Cache.cache[type] && Cache.cache[type][key] as T;
  }

  static delete(type: string, key: string | number) {
    Cache.cache[type] && delete(Cache.cache[type][key]);
  }

  static each<T>(type: string, callback: (item: T) => void) {
    Object.values<T>(Cache.cache[type] || {}).forEach(callback);
  }
}
