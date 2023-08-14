import {ExpressionSyntax} from "./expression.syntax.js";
import {StatementSyntax} from "./statement.syntax.js";
import {SpecialSyntax} from "./special.syntax.js";
import {TextSpan} from "../../common/text-span.js";


export enum SyntaxNodeKind {
  // Expressions
  BinaryExpressionSyntax,
  CommaExpressionSyntax,
  EmptyExpressionSyntax,
  LiteralExpressionSyntax,
  NameExpressionSyntax,
  ParenExpressionSyntax,
  UnaryExpressionSyntax,
  ArrayLiteralExpressionSyntax,

  // Special
  ElseClauseSyntax,
  ParameterSyntax,
  FileSyntax,
  TypeClause,

  // Statements
  BreakStatementSyntax,
  ContinueStatementSyntax,
  BlockStatementSyntax,
  ExpressionStatementSyntax,
  ForStatementSyntax,
  SemiColonSyntax,
  IfStatementSyntax,
  WhileStatementSyntax,
  ReturnStatementSyntax,
  EchoStatementSyntax,
  FunctionStatementSyntax,
  ClassStatementSyntax,
  PropertyStatementSyntax,
  PrintStatementSyntax,
  CaseStatementSyntax,
  SwitchStatementSyntax,
}


export type SyntaxNodeTypes = ExpressionSyntax | StatementSyntax | SpecialSyntax;

function debug(node: SyntaxNodeTypes) {
  return {debug: SyntaxNodeKind[node.kind]}
}

export function createExpressionNode<T extends ExpressionSyntax>(value: SyntaxNodeTypes): T & SyntaxNode {
  const instance = Object.create(SyntaxNode.prototype);
  return Object.assign(instance, debug(value), value, {fields: Object.keys(value)});
}

export function createStatementNode<T extends StatementSyntax>(value: SyntaxNodeTypes): T & SyntaxNode {
  const instance = Object.create(SyntaxNode.prototype);
  return Object.assign(instance, debug(value), value, {fields: Object.keys(value)});
}

export function createSpecialNode<T extends SpecialSyntax>(value: SyntaxNodeTypes): T & SyntaxNode {
  const instance = Object.create(SyntaxNode.prototype);
  return Object.assign(instance, debug(value), value, {fields: Object.keys(value)});
}

export class SyntaxNode {
  public readonly fields: (keyof SyntaxNodeTypes)[];

  get span() {
    const arr = this.fields.map(el => this[el]).flat().map(el => el.span).filter(Boolean);
    const first = arr[0];
    const last = arr.slice(-1)[0];
    return new TextSpan(first?.start, last?.end);
  }
}
