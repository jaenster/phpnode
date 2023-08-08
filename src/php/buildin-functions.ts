import {BuildInSymbol, MethodSymbol, TypeSymbol, VariableSymbol} from "../symbols/symbols.js";
import {BoundKind, createBoundSpecial} from "../binder/bound.node.js";
import {BoundParameter} from "../binder/bound-special.js";
import {__php__use} from "../lib/php-lib.js";

const createParam = (type: TypeSymbol, name = type.name) => createBoundSpecial({
  kind: BoundKind.BoundParameter,
  variable: new VariableSymbol('string', true, TypeSymbol.string)
}) as BoundParameter

export class BuiltinFunctions {
  public static readonly instances = new Map<string, BuildInSymbol>();

  static internalPrint: BuildInSymbol;
  static internalAssocArray: BuildInSymbol;
  static internalNamespace: BuildInSymbol;
  static internalUse: BuildInSymbol;
  static internalVarDump: BuildInSymbol;


  static {
    this.internalAssocArray = new BuildInSymbol('__php__array', TypeSymbol.func, [createParam(TypeSymbol.any, 'data'),], TypeSymbol.any);
    this.instances.set('__php__array', this.internalAssocArray);

    this.internalPrint = new BuildInSymbol('__php__print', TypeSymbol.func, [createParam(TypeSymbol.string, 'data'),], TypeSymbol.void)
    this.instances.set('__php__print', this.internalPrint);


    this.internalNamespace = new BuildInSymbol('__php__namespace', TypeSymbol.func, [
      createParam(TypeSymbol.string, 'namespaceString'),
      createParam(TypeSymbol.func, 'key'),
      createParam(TypeSymbol.func, 'cb')
    ], TypeSymbol.void);
    this.instances.set('__php__namespace', this.internalNamespace);

    this.internalUse = new BuildInSymbol('__php__use', TypeSymbol.func, [
      createParam(TypeSymbol.string, 'namespaceString'),
      createParam(TypeSymbol.func, 'key'),
      createParam(TypeSymbol.func, 'cb')
    ], TypeSymbol.void);
    this.instances.set('__php__use', this.internalUse);

    this.internalVarDump = new BuildInSymbol('var_dump', TypeSymbol.func, [createParam(TypeSymbol.any, 'data')], TypeSymbol.void);
    this.instances.set('var_dump', this.internalVarDump);
  }

}