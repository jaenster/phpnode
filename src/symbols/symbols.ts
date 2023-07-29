import {BoundParameter} from "../binder/bound-special.js";

export enum SymbolKind {
  TypeSymbol,
  VariableSymbol,
}

export class Symbol {
  public readonly kind: SymbolKind;
}

export class TypeSymbol extends Symbol {
  public readonly kind = SymbolKind.TypeSymbol;

  public static bool = new TypeSymbol('bool', true);
  public static func = new TypeSymbol('function', true);
  public static int = new TypeSymbol('int', true);
  public static Object = new TypeSymbol('Object', true);
  public static null = new TypeSymbol('null', true);
  public static string = new TypeSymbol('string', true);
  public static error = new TypeSymbol('error', true);
  public static void = new TypeSymbol('void', true);

  // A simple internal generic the same that comes out
  public static self = new TypeSymbol('self', true);

  public static beginTypes = [
    TypeSymbol.bool,
    TypeSymbol.func,
    TypeSymbol.int,
    TypeSymbol.null,
    TypeSymbol.string,
    TypeSymbol.error,
    TypeSymbol.void,
  ] as ReadonlyArray<TypeSymbol>;

  constructor(public readonly name: string, public readonly primary: boolean = false) {
    super();
  }

  toString() {
    return this.name;
  }
}

export class VariableSymbol extends Symbol {
  readonly kind: SymbolKind = SymbolKind.VariableSymbol;

  constructor(
    public readonly name: string,
    public readonly isReadonly: boolean,
    public readonly type: TypeSymbol,
  ) {
    super();
  }

  toString() {
    return this.name;
  }
}

export class MethodSymbol extends VariableSymbol {
  constructor(
    name: string,
    type: TypeSymbol,
    public readonly parameters: BoundParameter[],
    public readonly returnType: TypeSymbol,
  ) {
    super(name, false, type);
  }

  toString() {
    return this.name;
  }
}