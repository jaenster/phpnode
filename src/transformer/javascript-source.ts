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
import {SyntaxKind} from "../source/lexer.js";
import {ToSource} from "./to-source.js";
import {BoundKind} from "../binder/bound.node.js";
import {BoundBinaryOperator} from "../binder/bound-operator.js";

export const TokenMap = {
  // Literals
  [SyntaxKind.AmpersandAmpersandToken]: '&&',
  [SyntaxKind.AmpersandToken]: '&',
  [SyntaxKind.ExclamationEqualToken]: '!=',
  [SyntaxKind.ExclamationToken]: '!',
  [SyntaxKind.QuestionToken]: '?',
  [SyntaxKind.BraceLToken]: '{',
  [SyntaxKind.BraceRToken]: '}',
  [SyntaxKind.ColonColonToken]: '::',
  [SyntaxKind.ColonToken]: ':',
  [SyntaxKind.CommaToken]: ',',
  [SyntaxKind.EqualEqualToken]: '==',
  [SyntaxKind.EqualToken]: '=',
  [SyntaxKind.GreaterEqualToken]: '>=',
  [SyntaxKind.GreaterToken]: '>',
  [SyntaxKind.HatToken]: '^',
  [SyntaxKind.LessEqualToken]: '<=',
  [SyntaxKind.LessToken]: '<',
  [SyntaxKind.MinusMinusToken]: '--',
  [SyntaxKind.MinusToken]: '-',
  [SyntaxKind.ParenLToken]: '(',
  [SyntaxKind.ParenRToken]: ')',
  [SyntaxKind.PipePipeToken]: '||',
  [SyntaxKind.PipeToken]: '|',
  [SyntaxKind.PlusPlusToken]: '++',
  [SyntaxKind.PlusToken]: '+',
  [SyntaxKind.SlashToken]: '/',
  [SyntaxKind.StarToken]: '*',
  [SyntaxKind.TildeToken]: '~',
  [SyntaxKind.DotToken]: '.',
  [SyntaxKind.SemiColonToken]: ';',
  [SyntaxKind.DollarToken]: '$',
  [SyntaxKind.AtToken]: '@',

  // Keywords
  [SyntaxKind.BreakKeyword]: 'break',
  [SyntaxKind.ConstKeyword]: 'const',
  [SyntaxKind.ContinueKeyword]: 'continue',
  [SyntaxKind.ElseKeyword]: 'else',
  [SyntaxKind.FalseKeyword]: 'false',
  [SyntaxKind.ForKeyword]: 'for',
  [SyntaxKind.IfKeyword]: 'if',
  [SyntaxKind.LetKeyword]: 'let',
  [SyntaxKind.MethodKeyword]: 'method',
  [SyntaxKind.ReturnKeyword]: 'return',
  [SyntaxKind.TrueKeyword]: 'true',
  [SyntaxKind.WhileKeyword]: 'while',
}


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

    return left +TokenMap[node.operator.syntaxKind]+right;
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
    return ""
  }
}