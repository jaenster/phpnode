import {TypeSymbol, VariableSymbol} from "../symbols/symbols.js";

function weak<T extends object>() {
  let ref: WeakRef<T>;

  return (value: T, context: DecoratorContext) => {
    const {kind, name} = context;
    if (kind === "field") {
      context.access.get = function () {
        return ref?.deref();
      }
      context.access.set = function (v: T) {
        ref = v ? new WeakRef<T>(v) : undefined;
        return true;
      }
    }
  }
}

export class BoundScope {
  public readonly variables = new Map<string, VariableSymbol>();
  public readonly types = new Map<string, TypeSymbol>();

  @weak()
  public readonly parent?: BoundScope;

  constructor(
    parent?: BoundScope
  ) {
    this.parent = parent;
  }

  tryDeclare(variable: VariableSymbol) {
    if (this.variables.has(variable.name)) {
      return false
    }

    this.variables.set(variable.name, variable);
    return true;
  }

  tryLookup(name: string): [true, VariableSymbol] | [false] {
    const has = this.variables.get(name);
    if (has) {
      return [true, has];
    }

    if (!this.parent) {
      return [false];
    }
    return this.parent.tryLookup(name)
  }

  tryDeclareType(type: TypeSymbol) {
    if (this.types.has(type.name)) {
      return false
    }

    this.types.set(type.name, type);
    return true;
  }

  tryLookupType(name: string): TypeSymbol {
    const has = this.types.get(name);
    if (has) {
      return has;
    }

    if (!this.parent) {
      return;
    }
    return this.parent.tryLookupType(name)
  }

  declaredVariables() {
    return Array.from(this.variables.values());
  }

  createChild() {
    return new BoundScope(this);
  }
}