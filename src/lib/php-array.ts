export class PhpArray<T = any, K extends string | number = string | number> {

  public maxInt: number = 0;
  public mapOrder = new Map<K, number>;
  public internalValues: [K, T][] = [];

  internalSet(key: K, v: T) {
    this.mapOrder.set(key, this.internalValues.push([key, v]));
  }

  add(v: T) {
    this.internalSet(++this.maxInt as K, v);
  }

  addByKey(key: K, v: T) {
    this.internalSet(key, v)

    // $foo[5] = "foo"; $foo[] = "bar";. This last key becomes key 6
    const compare = Math.max(typeof key === 'number' ? key : 0, this.mapOrder.size);
    if (compare > this.maxInt) this.maxInt = compare;

    return v;
  }

  set(key: K, v: T) {
    const index = this.mapOrder.get(key);
    if (typeof index === 'undefined') {
      return this.addByKey(key, v);
    } else {
      this.internalValues[index][1] = v;
    }
  }

  toString() {
    // ToDo; php warning?
    return 'Array';
  }

  * [Symbol.iterator](): IterableIterator<T> {
    for (const [, v] of this.internalValues) {
      yield v;
    }
  };

  * entries(): IterableIterator<[K, T]> {
    for (const v of this.internalValues) {
      yield v;
    }
  }

  * keys(): IterableIterator<K> {
    for (const [k] of this.internalValues) {
      yield k;
    }
  }

  * values(): IterableIterator<T> {
    for (const [, v] of this.internalValues) {
      yield v;
    }
  }

  static create<T>(v: [string | undefined, T][]): PhpArray<T> {
    const self = new this;
    for (const [key, value] of v.values()) {
      if (typeof key === 'undefined') {
        self.add(value);
        continue;
      }
      // This is inline with php behavior, which strangely works out here in js
      let intKey = parseInt(key);
      const arrayKey = String(intKey) === key ? intKey : key;

      self.set(arrayKey, value);
    }
    return self;
  }
}