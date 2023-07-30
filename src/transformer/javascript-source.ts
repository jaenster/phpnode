import {BoundFile} from "../binder/bound-special.js";
import {
  BoundAssignmentExpression,
  BoundBinaryExpression,
  BoundCommaExpression,
  BoundErrorExpression,
  BoundExpression,
  BoundLiteralExpression,
  BoundNameExpression,
  BoundUnaryExpression,
  BoundVariableExpression
} from "../binder/bound-expression.js";
import {
  BoundBlockStatement,
  BoundBodyStatement,
  BoundBreakStatement,
  BoundContinueStatement,
  BoundExpressionStatement,
  BoundForStatement,
  BoundIfStatement,
  BoundJumpConditionalStatement,
  BoundJumpStatement,
  BoundLabelStatement,
  BoundReturnStatement,
  BoundSemiColonStatement,
  BoundVariableStatement,
  BoundWhileStatement
} from "../binder/bound-statement.js";
import {ToSource} from "./to-source.js";
import {BoundBinaryOperator} from "../binder/bound-operator.js";
import {KeywordsBySyntax} from "../source/syntax/keywords.js";
import {SyntaxKind} from "../source/syntax/syntax.kind.js";

function escape(string: string) {
  return JSON.stringify(string).slice(1, -1);
}

export class Javascript extends ToSource {
  toSourceFileStatement(node: BoundFile): string {
    const source = [
      `//Transpiled
export default __php__file("${escape(node.filename)})", async () => {`
    ];
    for (const statement of node.statements) {
      source.push(this.toSourceStatement(statement));
    }
    source.push(`});`)
    return source.join('\n');
  }


  toSourceAssignmentExpression(node: BoundAssignmentExpression): string {
    return node.variable.name + ' = ' + this.toSourceExpression(node.expression);
  }

  toSourceBinaryExpression(node: BoundBinaryExpression): string {
    const left = this.toSourceExpression(node.left);
    const right = this.toSourceExpression(node.right);
    const operator = node.operator;

    if (operator === BoundBinaryOperator.call) {
      return 'await '+left+"("+right+")";
    }

    return left +KeywordsBySyntax[node.operator.syntaxKind]+right;
  }

  toSourceBlockStatement(node: BoundBlockStatement): string {
    return "{\n"+node.statements.map(el => this.toSourceStatement(el)).join('\n')+'}\n';
  }

  toSourceBodyStatement(node: BoundBodyStatement): string {
    return "";
  }

  toSourceBreakStatement(node: BoundBreakStatement): string {
    return "";
  }

  toSourceCommaExpression(node: BoundCommaExpression): string {
    return "";
  }

  toSourceContinueStatement(node: BoundContinueStatement): string {
    return "";
  }

  toSourceExpressionStatement(node: BoundExpressionStatement): string {
    const expression = this.toSourceExpression(node.expression);
    return expression+';';
  }

  toSourceForStatement(node: BoundForStatement): string {
    return "";
  }

  toSourceIfStatement(node: BoundIfStatement): string {
    return "";
  }

  toSourceJumpConditionalStatement(node: BoundJumpConditionalStatement): string {
    return "";
  }

  toSourceJumpStatement(node: BoundJumpStatement): string {
    return "";
  }

  toSourceLabelStatement(node: BoundLabelStatement): string {
    return "";
  }

  toSourceLiteralExpression(node: BoundLiteralExpression): string {
    return node.value.text;
  }

  toSourceNameExpression(node: BoundNameExpression): string {
    return node.variable.name;
  }

  toSourceSemiColonStatement(node: BoundSemiColonStatement): string {
    return "";
  }

  toSourceUnaryExpression(node: BoundUnaryExpression): string {
    return "";
  }

  toSourceVariableExpression(node: BoundVariableExpression): string {
    return "";
  }

  toSourceVariableStatement(node: BoundVariableStatement): string {
    return "";
  }

  toSourceWhileStatement(node: BoundWhileStatement): string {
    return "";
  }

  toSourceReturnStatement(node: BoundReturnStatement): string {
    return "return "+this.toSourceExpression(node.expression)
  }
}