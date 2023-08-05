import {Transformer} from "./transformer.js";
import {
  BoundBlockStatement,
  BoundBreakStatement,
  BoundClassStatement,
  BoundContinueStatement,
  BoundEchoStatement,
  BoundStatement
} from "../binder/bound-statement.js";
import {BoundKind, BoundNode, createBoundExpression, createBoundStatement} from "../binder/bound.node.js";
import {BoundBinaryOperator, BoundBinaryOperatorKind} from "../binder/bound-operator.js";
import {TypeSymbol, VariableSymbol} from "../symbols/symbols.js";
import {BuiltinFunctions} from "../php/buildin-functions.js";
import {BoundFile} from "../binder/bound-special.js";
import {BoundBinaryExpression, BoundExpression, BoundNameExpression} from "../binder/bound-expression.js";
import {Modifiers} from "../source/syntax/syntax.facts.js";

export class PhpConcepts extends Transformer {

  transformEchoStatement(node: BoundEchoStatement): BoundStatement {
    const left = createBoundExpression({
      kind: BoundKind.BoundNameExpression,
      type: TypeSymbol.func,
      variable: BuiltinFunctions.internalPrint,
      modifiers: Modifiers.TranspilerInternal,
    });
    const right = this.transformExpression(node.expression);
    const operator = BoundBinaryOperator.call

    // An echo statement is just a call to print
    return createBoundStatement({
      kind: BoundKind.BoundExpressionStatement,
      expression: createBoundExpression({
        kind: BoundKind.BoundBinaryExpression,
        type: operator.resultType,
        left, operator, right,
        modifiers: 0,
      })
    })
  }

  wrapWithStringCast(node: BoundExpression): BoundExpression {
    // Already a string, no need to convert
    if (node.type === TypeSymbol.string) {
      return node;
    }

    // Wrap in function call String(node)
    return createBoundExpression({
      kind: BoundKind.BoundBinaryExpression,
      type: TypeSymbol.string,
      left: createBoundExpression({
        kind: BoundKind.BoundNameExpression,
        type: TypeSymbol.func,
        variable: new VariableSymbol('String', true, TypeSymbol.func),
        modifiers: 0,
      }),
      right: node,
      operator: BoundBinaryOperator.call,
      modifiers: Modifiers.TranspilerSync,
    })
  }

  transformBinaryExpression(node: BoundBinaryExpression): BoundExpression {

    switch (node.operator.kind) {

      // Transform "foo" . 5 to "foo" + String("foo")
      case BoundBinaryOperatorKind.Concatenation:
        return createBoundExpression({
          kind: BoundKind.BoundBinaryExpression,
          left: this.wrapWithStringCast(this.transformExpression(node.left)),
          right: this.wrapWithStringCast(this.transformExpression(node.right)),
          operator: BoundBinaryOperator.addition,
          type: TypeSymbol.string,
          modifiers: 0,
        })

      case BoundBinaryOperatorKind.MemberAccess: {
        break;
      }


      // Convert Foo::bar() to Foo.bar() for static access
      case BoundBinaryOperatorKind.StaticMemberAccess:
        // By wrapping this is another transform expression, this gets converted correctly again
        return this.transformExpression(createBoundExpression({
          kind: BoundKind.BoundBinaryExpression,
          operator: BoundBinaryOperator.getByOperatorKind(BoundBinaryOperatorKind.MemberAccess),
          left: node.left,
          right: node.right,
          type: TypeSymbol.string,
          modifiers: 0,
        }))
    }

    return super.transformBinaryExpression(node);
  }

  private currentNamespace = '';

  transformNameExpression(node: BoundNameExpression): BoundExpression {
    // Ignore internal name expressions to avoid recursion
    if ((node.modifiers & Modifiers.TranspilerInternal) === Modifiers.TranspilerInternal) {
      return super.transformNameExpression(node);
    }

    // Member access should not be converted to a use statement
    if (this.currentBinaryOperator?.kind === BoundBinaryOperatorKind.MemberAccess) {
      return super.transformNameExpression(node);
    }

    // Every name expression can be in another file
    const tmpLeft = createBoundExpression({
      kind: BoundKind.BoundNameExpression,
      type: TypeSymbol.func,
      variable: BuiltinFunctions.internalUse,
      modifiers: Modifiers.TranspilerInternal,
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
      kind: BoundKind.BoundParenExpression,
      type: operator.resultType,
      expression: createBoundExpression({
        kind: BoundKind.BoundBinaryExpression,
        type: operator.resultType,
        left, operator, right,
        modifiers: Modifiers.TranspilerParen,
      }),
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
      modifiers: Modifiers.TranspilerInternal,
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
          statements: [
            createBoundStatement({
              kind: BoundKind.BoundReturnStatement,
              // Expression is class statement which is a valid expression
              expression: node,
            })
          ]
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
        left, operator, right,
        modifiers: 0,
      })
    })
  }

  private wrapStatementInNamespace(node: BoundStatement) {
    switch (node.kind) {
      case BoundKind.BoundClassStatement:
        return this.wrapClassStatement(node);
      case BoundKind.BoundBlockStatement:
        return this.wrapBlockStatement(node);

      // These statements don't add anything to the namespace scope
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

  transformBreakStatement(node: BoundBreakStatement): BoundStatement {
    if (node.depth > 0) {
      // Tell the transpiler to add this label in the definition
      node.label.modifiers |= Modifiers.TranspilerExpose;
    }

    return node;
  }

  transformContinueStatement(node: BoundContinueStatement): BoundStatement {
    if (node.depth > 0) {
      // Tell the transpiler to add this label in the definition
      node.label.modifiers = Modifiers.TranspilerExpose;
    }

    return node;
  }
}