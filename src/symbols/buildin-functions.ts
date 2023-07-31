import {MethodSymbol, TypeSymbol, VariableSymbol} from "./symbols.js";
import {BoundKind, createBoundSpecial} from "../binder/bound.node.js";
import {BoundParameter} from "../binder/bound-special.js";
import {__php__use} from "../lib/php-lib.js";

const createParam = (type: TypeSymbol, name = type.name) => createBoundSpecial({
  kind: BoundKind.BoundParameter,
  variable: new VariableSymbol('string', true, TypeSymbol.string)
}) as BoundParameter

export class BuiltinFunctions {
  public static readonly instances = new Map<string, MethodSymbol>();


  static internalPrint: MethodSymbol;
  static internalNamespace: MethodSymbol;
  static internalUse: MethodSymbol;

  static {
    this.internalPrint = new MethodSymbol('__php__print', TypeSymbol.func, [createParam(TypeSymbol.string, 'data'),], TypeSymbol.void)
    this.instances.set('__php__print', this.internalPrint);


    this.internalNamespace = new MethodSymbol('__php__namespace', TypeSymbol.func, [
      createParam(TypeSymbol.string, 'namespaceString'),
      createParam(TypeSymbol.func, 'key'),
      createParam(TypeSymbol.func, 'cb')
    ], TypeSymbol.void);
    this.instances.set('__php__namespace', this.internalNamespace);

    this.internalUse = new MethodSymbol('__php__use', TypeSymbol.func, [
      createParam(TypeSymbol.string, 'namespaceString'),
      createParam(TypeSymbol.func, 'key'),
      createParam(TypeSymbol.func, 'cb')
    ], TypeSymbol.void);
    this.instances.set('__php__use', this.internalUse);
  }

}