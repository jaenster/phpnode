const readySymbol = Symbol('WaitFor-Promise');
const resolveSymbol = Symbol('WaitFor-Resolve');


type thisType = { [readySymbol]?: Promise<void>, [resolveSymbol]?: () => void }


const upsert = (obj: thisType) => void (obj[readySymbol] ??= new Promise((resolve) => obj[resolveSymbol] = resolve));

export function WaitFor() {
  return function <T extends (...[]) => Promise<any | void>>(original: T, context: ClassMethodDecoratorContext) {
    return async function (this: thisType) {
      upsert(this);
      await this[readySymbol];
      return await original.apply(this, arguments);
    }
  }
}

export function WaitOn() {
  return function <T extends (...[]) => Promise<any | void>>(original: T, context: ClassMethodDecoratorContext) {
    return async function (this: thisType) {
      upsert(this);

      const ret = await original.apply(this, arguments);
      await this[resolveSymbol]();
      return ret;
    }
  }
}