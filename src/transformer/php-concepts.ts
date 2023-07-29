import {Transformer} from "./transformer.js";
import {BoundEchoStatement, BoundStatement} from "../binder/bound-statement.js";
import {BoundKind, createBoundExpression, createBoundStatement} from "../binder/bound.node.js";
import {BoundBinaryOperator} from "../binder/bound-operator.js";
import {TypeSymbol} from "../symbols/symbols.js";
import {BuiltinFunctions} from "../symbols/buildin-functions.js";

export class PhpConcepts extends Transformer {

  transformEchoStatement(node: BoundEchoStatement): BoundStatement {
    const left = createBoundExpression({
      kind: BoundKind.BoundNameExpression,
      type: TypeSymbol.func,
      variable: BuiltinFunctions.print,
    });
    const right = this.transformExpression(node.expression);
    const operator = BoundBinaryOperator.call

    // An echo statement is just a call to print
    return createBoundStatement({
      kind: BoundKind.BoundExpressionStatement,
      expression: createBoundExpression({
        kind: BoundKind.BoundBinaryExpression,
        type: operator.resultType,
        left, operator, right
      })
    })

  }
}