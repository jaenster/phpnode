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
import {BuildInSymbol, TypeSymbol, VariableSymbol} from "../symbols/symbols.js";
import {BuiltinFunctions} from "../php/buildin-functions.js";
import {BoundFile} from "../binder/bound-special.js";
import {
  BoundArrayLiteralExpression,
  BoundBinaryExpression,
  BoundExpression,
  BoundNameExpression
} from "../binder/bound-expression.js";
import {Modifiers} from "../source/syntax/syntax.facts.js";

export class PhpConcepts extends Transformer {

  transformEchoStatement(node: BoundEchoStatement): BoundStatement {
    const left = createBoundExpression({
      kind: BoundKind.BoundNameExpression,
      type: TypeSymbol.func,
      variable: BuiltinFunctions.internalPrint,
      modifiers: Modifiers.TranspilerInternal,
      tokens: [],
    });
    const right = this.transformExpression(node.expression);
    const operator = BoundBinaryOperator.call

    // An echo statement is just a call to print
    return createBoundStatement({
      kind: BoundKind.BoundExpressionStatement,
      tokens: node.tokens,
      expression: createBoundExpression({
        kind: BoundKind.BoundBinaryExpression,
        type: operator.resultType,
        left, operator, right,
        modifiers: Modifiers.TranspilerSync,
        tokens: [],
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
        tokens: [],
      }),
      right: node,
      operator: BoundBinaryOperator.call,
      modifiers: Modifiers.TranspilerSync,
      tokens: node.tokens,
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
          tokens: node.tokens,
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
          tokens: node.tokens,
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

    if (node.variable instanceof BuildInSymbol) {
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
      tokens: [],
    });

    // __php__use(namespaceString, context)
    // __php__use("Foo", "")
    const tmpRight = createBoundExpression({
      kind: BoundKind.BoundCommaExpression,
      type: TypeSymbol.any,
      tokens: [],
      expressions: [
        //  "Foo"
        createBoundExpression({
          kind: BoundKind.BoundLiteralExpression,
          type: TypeSymbol.string,
          value: node.variable.name,
          tokens: [],
        }),
        // ""
        createBoundExpression({
          kind: BoundKind.BoundLiteralExpression,
          type: TypeSymbol.string,
          value: this.currentNamespace, // Class key
          tokens: [],
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
      tokens: node.tokens,
      expression: createBoundExpression({
        kind: BoundKind.BoundBinaryExpression,
        type: operator.resultType,
        left, operator, right,
        modifiers: Modifiers.TranspilerParen,
        tokens: [],
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
        tokens: node.tokens,
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
      tokens: node.tokens,
    });

    // Create arguments ('Namespace', 'Foo', async () => class Foo {})
    const tmpRight = createBoundExpression({
      kind: BoundKind.BoundCommaExpression,
      tokens: [],
      type: TypeSymbol.any,
      expressions: [
        //  "Namespace"
        createBoundExpression({
          kind: BoundKind.BoundLiteralExpression,
          type: TypeSymbol.string,
          value: this.currentNamespace,
          tokens: [],
        }),
        // "Foo"
        createBoundExpression({
          kind: BoundKind.BoundLiteralExpression,
          type: TypeSymbol.string,
          value: node.name, // Class key
          tokens: [],
        }),
        // function () {return class Bar {}}
        createBoundExpression({
          kind: BoundKind.BoundFunctionStatement,
          type: TypeSymbol.func,
          parameters: [],
          scope: node.scope.createChild(),
          modifiers: 0,
          tokens: [],
          statements: [
            createBoundStatement({
              kind: BoundKind.BoundReturnStatement,
              // Expression is class statement which is a valid expression
              expression: node,
              tokens: [],
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
      tokens: node.tokens,
      expression: createBoundExpression({
        tokens: [],
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

  private transformArrayLiteralMember(node: BoundExpression): BoundExpression {
    switch (node.kind) {
      case BoundKind.BoundBinaryExpression:
        // ["a" => 5] or [$foo->bar() => $foo->baz()]
        if (node.operator === BoundBinaryOperator.getByOperatorKind(BoundBinaryOperatorKind.FatArrow)) {
          // convert to [["a", 5]]
          return createBoundExpression({
            kind: BoundKind.BoundJavascriptLiteralArrayExpression,
            type: TypeSymbol.any,
            expressions: [ // $foo->bar(), $foo->baz()
              node.left,
              node.right,
            ],
            tokens: node.tokens,
          })
        }

      // fallthrough
      default: // [$foo->bar(),5]
        // case BoundKind.BoundLiteralExpression: // simply 5 or "5"
        // convert to [[undefined, 5]]
        return createBoundExpression({
          kind: BoundKind.BoundJavascriptLiteralArrayExpression,
          type: TypeSymbol.any,
          expressions: [ // undefined, expression
            createBoundExpression({
              kind: BoundKind.BoundLiteralExpression,
              value: undefined,
              type: TypeSymbol.void,
              tokens: [],
            }),
            node
          ],
          tokens: node.tokens,
        })
    }
  }

  transformArrayLiteralExpression(node: BoundArrayLiteralExpression): BoundExpression {
    // Transform php array literals

    const left = createBoundExpression({
      kind: BoundKind.BoundNameExpression,
      type: TypeSymbol.func,
      variable: BuiltinFunctions.internalAssocArray,
      modifiers: Modifiers.TranspilerInternal | Modifiers.TranspilerSync,
      tokens: [],
    });


    // Wrap them all in an array
    const right = createBoundExpression({
      kind: BoundKind.BoundJavascriptLiteralArrayExpression,
      type: TypeSymbol.any,
      expressions: node.expressions.map(el => this.transformArrayLiteralMember(el)),
      tokens: [],
    });


    const operator = BoundBinaryOperator.call

    return createBoundExpression({
      kind: BoundKind.BoundBinaryExpression,
      type: operator.resultType,
      left, operator, right,
      modifiers: Modifiers.TranspilerSync,
      tokens: node.tokens,
    })
  }

}