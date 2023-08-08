import {PhpClassName, PhpFields, PhpGetField, PhpInstanceCounter, PhpStaticClass, PhpVarDump} from "./symbols.js";

function escape(string: string) {
  return JSON.stringify(string).slice(1, -1);
}

export class PhpClass {

  constructor() {
    this[PhpStaticClass][PhpInstanceCounter] ??= 0;
    this[PhpInstanceCounter] = this[PhpStaticClass][PhpInstanceCounter]++;
  }

  get [PhpStaticClass]() {
    return Object.getPrototypeOf(this)?.constructor;
  }

  get [PhpClassName]() {
    return 'Object('+this[PhpStaticClass].name+')#'+this[PhpInstanceCounter];
  }

  [PhpGetField](k: string|number) {
    return this[k];
  }
}