import {Transformer} from "./transformer.js";
import {
  BoundBlockStatement,
  BoundClassStatement,
  BoundEchoStatement,
  BoundStatement
} from "../binder/bound-statement.js";
import {BoundKind, BoundNode, createBoundExpression, createBoundStatement} from "../binder/bound.node.js";
import {BoundBinaryOperator} from "../binder/bound-operator.js";
import {TypeSymbol} from "../symbols/symbols.js";
import {BuiltinFunctions} from "../symbols/buildin-functions.js";
import {BoundFile} from "../binder/bound-special.js";
import {BoundExpression, BoundNameExpression} from "../binder/bound-expression.js";
import {BoundModifiers} from "../binder/bound-modifiers.js";

export class PhpConcepts extends Transformer {

  transformEchoStatement(node: BoundEchoStatement): BoundStatement {
    const left = createBoundExpression({
      kind: BoundKind.BoundNameExpression,
      type: TypeSymbol.func,
      variable: BuiltinFunctions.internalPrint,
      modifiers: BoundModifiers.TranspilerInternal,
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

  private currentNamespace = '';

  transformNameExpression(node: BoundNameExpression): BoundExpression {
    // Ignore internal name epxressions to avoid recursion
    if ((node.modifiers & BoundModifiers.TranspilerInternal) === BoundModifiers.TranspilerInternal) {
      return super.transformNameExpression(node);
    }

    // Every name expression can be in another file
    const tmpLeft = createBoundExpression({
      kind: BoundKind.BoundNameExpression,
      type: TypeSymbol.func,
      variable: BuiltinFunctions.internalUse,
      modifiers: BoundModifiers.TranspilerInternal,
    });

    // __php__use(namespaceString, context)
    // __php__use("Foo", "")
    const tmpRight = createBoundExpression({
      kind: BoundKind.BoundCommaExpression,
      type: TypeSymbol.any,
      expressions: [
        //  "Foo"
        createBoundExpression({
          kind: BoundKind.BoundLiteralExpression,
          type: TypeSymbol.string,
          value: node.variable.name,
        }),
        // ""
        createBoundExpression({
          kind: BoundKind.BoundLiteralExpression,
          type: TypeSymbol.string,
          value: this.currentNamespace, // Class key
        }),
      ],
    });

    // Allow rewriting on these expressions. (e.g. variable hoisting in the child function)
    const left = this.transformExpression(tmpLeft);
    const right = this.transformExpression(tmpRight);

    const operator = BoundBinaryOperator.call

    return createBoundExpression({
      kind: BoundKind.BoundBinaryExpression,
      type: operator.resultType,
      left, operator, right
    })
  }

  private wrapBlockStatement(node: BoundBlockStatement) {
    const statements = [];
    let isNew = false;

    for (const old of node.statements) {
      const statement = this.wrapStatementInNamespace(old);
      isNew ||= statement !== old;
      statements.push(statement);
    }

    if (isNew) {
      return createBoundStatement({
        kind: BoundKind.BoundBlockStatement,
        statements,
      })
    }


    return node;
  }

  private wrapClassStatement(node: BoundClassStatement) {
    // Functions are first class in javascript, and classes are just functions
    // In php anything is accessible from global scope (even if namespaced)
    // Simply wrap everything to make it available in a global namespace under a variable in js

    const tmpLeft = createBoundExpression({
      kind: BoundKind.BoundNameExpression,
      type: TypeSymbol.func,
      variable: BuiltinFunctions.internalNamespace,
      modifiers: BoundModifiers.TranspilerInternal,
    });

    // Create arguments ('Namespace', 'Foo', async () => class Foo {})
    const tmpRight = createBoundExpression({
      kind: BoundKind.BoundCommaExpression,
      type: TypeSymbol.any,
      expressions: [
        //  "Namespace"
        createBoundExpression({
          kind: BoundKind.BoundLiteralExpression,
          type: TypeSymbol.string,
          value: this.currentNamespace,
        }),
        // "Foo"
        createBoundExpression({
          kind: BoundKind.BoundLiteralExpression,
          type: TypeSymbol.string,
          value: node.name, // Class key
        }),
        // function () {return class Bar {}}
        createBoundExpression({
          kind: BoundKind.BoundFunctionStatement,
          type: TypeSymbol.func,
          parameters: [],
          scope: node.scope.createChild(),
          body: createBoundStatement({
            kind: BoundKind.BoundBlockStatement,
            statements: [
              createBoundStatement({
                kind: BoundKind.BoundReturnStatement,
                // Expression is class statement which is a valid expression
                expression: node,
              })
            ]
          })
        })
      ],
    });

    // Allow rewriting on these expressions. (e.g. variable hoisting in the child function)
    const left = this.transformExpression(tmpLeft);
    const right = this.transformExpression(tmpRight);

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

  private wrapStatementInNamespace(node: BoundStatement) {
    switch (node.kind) {
      case BoundKind.BoundClassStatement:
        return this.wrapClassStatement(node);
      case BoundKind.BoundBlockStatement:
        return this.wrapBlockStatement(node);

      // These statements dont add anything to the namespace scope
      default:
        return node;
    }

  }

  transformFile(arg: BoundFile): BoundFile & BoundNode {
    const parent = super.transformFile(arg);

    const statements: BoundStatement[] = [];
    let isNew = false;
    // wrap all outer scope statements scopes
    for (const old of parent.statements) {
      const statement = this.wrapStatementInNamespace(old);
      isNew ||= statement !== old;
      statements.push(statement);
    }

    if (isNew) {
      return createBoundStatement({
        kind: BoundKind.BoundFile,
        statements,
        filename: arg.filename,
        scope: arg.scope,
      })
    }

    return parent as BoundFile & BoundNode;
  }
}