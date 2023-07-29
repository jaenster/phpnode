import {MethodSymbol, TypeSymbol, VariableSymbol} from "./symbols.js";
import {BoundKind, createBoundSpecial} from "../binder/bound.node.js";
import {BoundParameter} from "../binder/bound-special.js";

const createParam = (type: TypeSymbol, name = type.name) => createBoundSpecial({
  kind: BoundKind.BoundParameter,
  variable: new VariableSymbol('string', true, TypeSymbol.string)
}) as BoundParameter

export class BuiltinFunctions {
  public static readonly instances = new Map<string, MethodSymbol>();


  static print: MethodSymbol;

  static {
    this.print = new MethodSymbol('__php__print', TypeSymbol.func, [createParam(TypeSymbol.string, 'data'),], TypeSymbol.void)
    this.instances.set('__php__print', this.print);
    this.instances.set('input', new MethodSymbol('input', TypeSymbol.func, [], TypeSymbol.string));
  }

}