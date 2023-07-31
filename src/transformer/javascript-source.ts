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
  BoundBreakStatement, BoundClassStatement,
  BoundContinueStatement,
  BoundExpressionStatement,
  BoundForStatement, BoundFunctionStatement,
  BoundIfStatement,
  BoundJumpConditionalStatement,
  BoundJumpStatement,
  BoundLabelStatement, BoundMethodStatement, BoundPropertyStatement,
  BoundReturnStatement,
  BoundSemiColonStatement,
  BoundVariableStatement,
  BoundWhileStatement
} from "../binder/bound-statement.js";
import {ToSource} from "./to-source.js";
import {BoundBinaryOperator, BoundBinaryOperatorKind, BoundUnaryOperatorKind} from "../binder/bound-operator.js";
import {KeywordsByName, KeywordsBySyntax} from "../source/syntax/keywords.js";
import {BoundScope} from "../binder/bound-scope.js";

function escape(string: string) {
  return JSON.stringify(string).slice(1, -1);
}


const binaryOperators = {
  [BoundBinaryOperatorKind.Addition]: '+',
  [BoundBinaryOperatorKind.MemberAccess]: '.',
} as const

const unaryOperators = {
  [BoundUnaryOperatorKind.New]: KeywordsBySyntax[KeywordsByName.new],
} as const

export class Javascript extends ToSource {

  toSourceDeclareVariables(scope: BoundScope) {
    // In javascript, variables need to exist before they are used
    // They are block scoped too, to avoid issues with it, abuse the way javascript works

    const names = [];
    for (const name of scope.variables.keys()) {
      names.push(name);
    }

    return names.length ? 'let ' + names.join(', ') : '';
  }

  toSourceFileStatement(node: BoundFile): string {
    const source = [
      `//Transpiled
export default __php__file("${escape(node.filename)}", async () => {`
    ];

    const declarations = this.toSourceDeclareVariables(node.scope);
    if (declarations) source.push(declarations);

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
      return 'await (' + left + "(" + right + "))";
    } else if (operator === BoundBinaryOperator.memberCall) {
      return 'await (' + left + "(" + right + "))";
    }

    const operatorString = binaryOperators[node.operator.kind];
    return left + operatorString + right;
  }

  toSourceBlockStatement(node: BoundBlockStatement): string {
    return "{\n" + node.statements.map(el => this.toSourceStatement(el)).join('\n') + '}\n';
  }

  toSourceBodyStatement(node: BoundBodyStatement): string {
    return "";
  }

  toSourceBreakStatement(node: BoundBreakStatement): string {
    return "";
  }

  toSourceCommaExpression(node: BoundCommaExpression): string {
    return node.expressions.map(el => this.toSourceExpression(el)).join(',');
  }

  toSourceContinueStatement(node: BoundContinueStatement): string {
    return "";
  }

  toSourceExpressionStatement(node: BoundExpressionStatement): string {
    const expression = this.toSourceExpression(node.expression);
    return expression + ';';
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
    // Literal value can be a SyntaxToken, a string, a number, null
    return typeof node.value === 'string' ? `"${escape(node.value)}"` : node?.value?.text;
  }

  toSourceNameExpression(node: BoundNameExpression): string {
    return node.variable.name;
  }

  toSourceSemiColonStatement(node: BoundSemiColonStatement): string {
    return "";
  }

  toSourceUnaryExpression(node: BoundUnaryExpression): string {
    const content = this.toSourceExpression(node.operand);
    const operator = unaryOperators[node.operator.kind];

    if (operator === 'new') {
      return 'new (' + content + ')';
    }

    return node.operator.post ? content + operator : operator + ' ' + content;
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
    return "return " + this.toSourceExpression(node.expression)
  }

  toSourceFunctionStatement(node: BoundFunctionStatement) {
    const lines = [];
    lines.push(`async function ${node.name ?? ''}(${node.parameters.map(el => el.variable.name).join(', ')}) {`);
    lines.push(this.toSourceStatement(node.body));
    lines.push(`}`)
    return lines.join('\n');
  }

  toSourceMethodStatement(node: BoundMethodStatement) {
    const lines = [];
    lines.push(`${node.name}(${node.parameters.map(el => el.variable.name).join(', ')}) {`);
    lines.push(this.toSourceStatement(node.body));
    lines.push(`}`)
    return lines.join('\n');
  }

  toSourceProperty(property: BoundPropertyStatement): string {
    return property.name;
  }

  toSourceClassStatement(statement: BoundClassStatement) {
    const lines = [];

    lines.push(`class ` + statement.name + ' {');
    for (const property of statement.properties) {
      lines.push(this.toSourceProperty(property));
    }

    for (const member of statement.methods) {
      lines.push(this.toSourceMethodStatement(member));
    }

    lines.push('}');
    return lines.join('\n');
  }
}