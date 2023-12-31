import {BoundFile, BoundLabel} from "../binder/bound-special.js";
import {
  BoundAssignmentExpression,
  BoundBinaryExpression,
  BoundCommaExpression,
  BoundEmptyExpression, BoundJavascriptLiteralArrayExpression,
  BoundLiteralExpression,
  BoundNameExpression,
  BoundParenExpression,
  BoundUnaryExpression,
  BoundVariableExpression
} from "../binder/bound-expression.js";
import {
  BoundBlockStatement,
  BoundBodyStatement,
  BoundBreakStatement,
  BoundCaseStatement,
  BoundClassStatement,
  BoundContinueStatement,
  BoundExpressionStatement,
  BoundForStatement,
  BoundFunctionStatement,
  BoundIfStatement,
  BoundJumpConditionalStatement,
  BoundJumpStatement,
  BoundLabelStatement,
  BoundMethodStatement,
  BoundPropertyStatement,
  BoundReturnStatement,
  BoundSemiColonStatement,
  BoundSwitchStatement,
  BoundWhileStatement
} from "../binder/bound-statement.js";
import {ToSource} from "./to-source.js";
import {
  BoundBinaryOperator,
  BoundBinaryOperatorKind,
  BoundUnaryOperatorKind
} from "../binder/bound-operator.js";
import {KeywordsByName, KeywordsBySyntax} from "../source/syntax/keywords.js";
import {BoundScope} from "../binder/bound-scope.js";
import {isModifierSet, Modifiers} from "../source/syntax/syntax.facts.js";
import {BoundKind, BoundNode} from "../binder/bound.node.js";
import {BuildInSymbol} from "../symbols/symbols.js";
import {MapExt} from "map-ext";

function escape(string: string) {
  return JSON.stringify(string).slice(1, -1);
}


const binaryOperators = {
  [BoundBinaryOperatorKind.Addition]: '+',
  [BoundBinaryOperatorKind.Assignment]: '=',
  [BoundBinaryOperatorKind.MemberAccess]: '.',
  [BoundBinaryOperatorKind.StaticMemberAccess]: '.',
  [BoundBinaryOperatorKind.Nullish]: '??',

  [BoundBinaryOperatorKind.Subtraction]: '-',
  [BoundBinaryOperatorKind.Multiplication]: '*',
  [BoundBinaryOperatorKind.Expo]: '**',
  [BoundBinaryOperatorKind.Division]: '/',
  [BoundBinaryOperatorKind.LogicalAnd]: '&&',
  [BoundBinaryOperatorKind.LogicalOr]: '||',
  [BoundBinaryOperatorKind.Equals]: '==',
  [BoundBinaryOperatorKind.NotEquals]: '!=',
  [BoundBinaryOperatorKind.StrictEqual]: '===',
  [BoundBinaryOperatorKind.StrictNotEqual]: '!==',
  [BoundBinaryOperatorKind.Less]: '<',
  [BoundBinaryOperatorKind.LessEqual]: '<=',
  [BoundBinaryOperatorKind.Greater]: '>',
  [BoundBinaryOperatorKind.GreaterEqual]: '>=',

  [BoundBinaryOperatorKind.BitwiseAnd]: '&',
  [BoundBinaryOperatorKind.BitwiseOr]: '|',
  [BoundBinaryOperatorKind.BitwiseXor]: '^',
} as const

const unaryOperators = {
  [BoundUnaryOperatorKind.New]: KeywordsBySyntax[KeywordsByName.new],
  [BoundUnaryOperatorKind.PostFixIncrease]: '++',
  [BoundUnaryOperatorKind.PrefixIncrease]: '++',
  [BoundUnaryOperatorKind.PostFixDecrease]: '--',
  [BoundUnaryOperatorKind.PrefixDecrease]: '--',
} as const

export class Javascript extends ToSource {

  ident = '';

  addIndent() {
    this.ident += '  ';
  }

  removeIdent() {
    this.ident = this.ident.substring(0, Math.max(0, this.ident.length - 2));
  }

  toSourceParenExpression(node: BoundParenExpression): string {
    return "(" + this.toSourceExpression(node.expression) + ')';
  }

  toSourceDeclareImports(node: BoundNode) {
    let imports = new MapExt<string, Set<string>>(() => new Set);
    imports.get('@jaenster/php-native').add('__php__file');
    for (const child of BoundNode.traverse(node)) {
      switch (child.kind) {
        case BoundKind.BoundNameExpression: {

          if (child.variable instanceof BuildInSymbol && child.variable.imported) {
            imports.get(child.variable.importedFrom).add(child.variable.name);
          }
        }
      }
    }

    const lines = [];
    for (const [name, fields] of imports) {
      lines.push(this.ident + 'import {' + [...fields].join(', ') + '} from "' + escape(name) + '"')
    }
    return lines.join('\n');
  }

  toSourceDeclareVariables(scope: BoundScope) {
    // In javascript, variables need to exist before they are used
    // They are block scoped too, to avoid issues with it, abuse the way javascript works

    const names = [];
    for (const name of scope.variables.keys()) {
      if (name.startsWith('$')) {
        names.push(name);
      }
    }

    return names.length ? this.ident + 'let ' + names.join(', ') : '';
  }

  toSourceFileStatement(node: BoundFile): string {
    const source = [
      this.toSourceDeclareImports(node as unknown as BoundNode),
      `//Transpiled
export default __php__file("${escape(node.filename)}", async () => {`
    ];

    this.addIndent()
    const declarations = this.toSourceDeclareVariables(node.scope);
    if (declarations) source.push(declarations);

    for (const statement of node.statements) {
      source.push(this.toSourceStatement(statement));
    }
    this.removeIdent()
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

    const prefixes = isModifierSet(node, Modifiers.TranspilerSync) ? '' : 'await '
    if (operator === BoundBinaryOperator.call) {
      return prefixes + left + "(" + right + ")";
    } else if (operator === BoundBinaryOperator.memberCall) {
      return prefixes + left + "(" + right + ")";
    }

    const operatorString = binaryOperators[node.operator.kind];
    if (operatorString === undefined) {
      throw new Error('operator ' + BoundBinaryOperatorKind[node.operator.kind] + ' does not exists in javascript');
    }
    return left + operatorString + right;
  }

  toSourceBlockStatement(node: BoundBlockStatement): string {
    const lines = [this.ident + '{'];
    this.addIndent();
    for (const statement of node.statements) {
      lines.push(this.ident + this.toSourceStatement(statement));
    }
    this.removeIdent();
    lines.push(this.ident + '}');
    return lines.join('\n');
  }

  toSourceBodyStatement(node: BoundBodyStatement): string {
    return this.toSourceStatement(node.statement);
  }

  toSourceBreakStatement(node: BoundBreakStatement): string {
    if (node.depth) {
      return "break "+node.label.name;
    }
    return "break";
  }

  toSourceCommaExpression(node: BoundCommaExpression): string {
    return node.expressions.map(el => this.toSourceExpression(el)).join(',');
  }

  toSourceContinueStatement(node: BoundContinueStatement): string {
    if (node.depth) {
      return "continue "+node.label.name;
    }
    return "continue";
  }

  toSourceExpressionStatement(node: BoundExpressionStatement): string {
    const expression = this.ident + this.toSourceExpression(node.expression);
    return expression + ';';
  }

  toSourceForStatement(node: BoundForStatement): string {
    const lines = [];
    this.toSourceLabel(node.body.break, lines);
    // If label is given, it needs to add ident on the first line
    const firstIdent = (lines.length ? this.ident : '');
    lines.push(firstIdent+ 'for('+this.toSourceExpression(node.init)+';'+this.toSourceExpression(node.condition)+';'+this.toSourceExpression(node.afterthought)+')');

    this.addIndent();
    lines.push(this.toSourceStatement(node.body))
    this.removeIdent();

    return lines.join('\n')
  }

  toSourceIfStatement(node: BoundIfStatement): string {
    const lines = [];
    lines.push('if ('+this.toSourceExpression(node.condition)+')');
    lines.push(this.toSourceStatement(node.body));

    if (node.elseBody) {
      lines.push(this.ident+'else'+this.toSourceStatement(node));
    }

    return lines.join('\n')
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
    let content = this.toSourceExpression(node.operand);
    const operator = unaryOperators[node.operator.kind];

    if (operator === 'new') {
      // Quick fix to get rid of stupid statements
      if (content.startsWith('await')) content = content.substring(5);
      return '(new ' + content + ')';
    }

    return node.operator.post ? content + operator : operator + ' ' + content;
  }

  toSourceVariableExpression(node: BoundVariableExpression): string {
    return node.variable.name;
  }

  toSourceWhileStatement(node: BoundWhileStatement): string {
    return "";
  }

  toSourceReturnStatement(node: BoundReturnStatement): string {
    return "return " + this.toSourceExpression(node.expression).trim()
  }

  toSourceFunctionStatement(node: BoundFunctionStatement) {
    const lines = [];
    lines.push(`${this.ident}async function ${node.name ?? ''}(${node.parameters.map(el => el.variable.name).join(', ')}) {`);
    this.addIndent();
    for (const statement of node.statements) {
      lines.push(this.ident + this.toSourceStatement(statement));
    }
    this.removeIdent();
    lines.push(`${this.ident}}`);
    return lines.join('\n');
  }

  toSourceMethodStatement(node: BoundMethodStatement) {
    const lines = [];
    lines.push(`${this.ident}async ${node.name}(${node.parameters.map(el => el.variable.name).join(', ')}) {`);
    this.addIndent();
    for (const statement of node.statements) {
      lines.push(this.ident + this.toSourceStatement(statement));
    }
    this.removeIdent();
    lines.push(`${this.ident}}`)
    return lines.join('\n');
  }

  toSourceProperty(property: BoundPropertyStatement): string {
    return property.name;
  }

  toSourceClassStatement(statement: BoundClassStatement) {
    const lines = [];

    lines.push(this.ident + `class ` + statement.name + ' {');
    this.addIndent();
    for (const property of statement.properties) {
      lines.push(this.toSourceProperty(property));
    }

    for (const member of statement.methods) {
      lines.push(this.toSourceMethodStatement(member));
    }
    this.removeIdent();

    lines.push(this.ident + '}');
    return lines.join('\n');
  }

  toSourceEmptyExpression(statement: BoundEmptyExpression): string {
    return "";
  }

  toSourceLabel(node: BoundLabel, lines: string[]) {
    if (isModifierSet(node, Modifiers.TranspilerExpose)) {
      lines.push(this.ident+node.name+':');
    }
  }

  toSourceSwitchStatement(node: BoundSwitchStatement): string {
    const lines = [];
    this.toSourceLabel(node.break, lines);

    lines.push(this.ident+'switch ('+this.toSourceExpression(node.expression)+') {');
    this.addIndent();
    for(const caseNode of node.cases) {
      lines.push(this.toSourceCaseStatement(caseNode));
    }
    this.removeIdent();
    lines.push(this.ident+'}')
    return lines.join('\n');
  }

  toSourceCaseStatement(node: BoundCaseStatement): string {
    const lines = [];
    lines.push(this.ident+'case '+this.toSourceExpression(node.expression)+':');
    this.addIndent();
    for(const statement of node.statements) {
      lines.push(this.toSourceStatement(statement));
    }
    this.removeIdent();

    return lines.join('\n');
  }

  toSourceJavascriptLiteralArrayExpression(statement: BoundJavascriptLiteralArrayExpression): string {
    return "["+statement.expressions.map(el => this.toSourceExpression(el)).join(', ')+']';
  }
}