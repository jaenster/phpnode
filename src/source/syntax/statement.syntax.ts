import type {ElseClause, ParametersSyntax, TypeClause} from "./special.syntax.js";
import type {ExpressionSyntax} from "./expression.syntax.js";
import {SyntaxToken} from "../lexer.js";
import {SyntaxNodeKind} from "./syntax.node.js";

export type StatementSyntax =
  | BlockStatementSyntax
  | BreakStatementSyntax
  | ContinueStatementSyntax
  | ExpressionStatementSyntax
  | ForStatementSyntax
  | IfStatementSyntax
  | MethodStatementSyntax
  | ReturnStatementSyntax
  | SemiColonSyntax
  | VariableStatementSyntax
  | WhileStatementSyntax
  | EchoStatementSyntax


// Never for now, will be a thing later
export type BlockStatementSyntax = {
  kind: SyntaxNodeKind.BlockStatementSyntax,
  open: SyntaxToken,
  statements: StatementSyntax[],
  close: SyntaxToken,
}
export type BreakStatementSyntax = {
  kind: SyntaxNodeKind.BreakStatementSyntax,
  keyword: SyntaxToken,
}
export type ContinueStatementSyntax = {
  kind: SyntaxNodeKind.ContinueStatementSyntax,
  keyword: SyntaxToken,
}
export type ExpressionStatementSyntax = {
  kind: SyntaxNodeKind.ExpressionStatementSyntax,
  expression: ExpressionSyntax,
}
export type ForStatementSyntax = {
  kind: SyntaxNodeKind.ForStatementSyntax
  keyword: SyntaxToken,
  init: ExpressionStatementSyntax | VariableStatementSyntax,
  condition: ExpressionSyntax,
  afterthought: ExpressionSyntax,
  body: StatementSyntax,
}
export type IfStatementSyntax = {
  kind: SyntaxNodeKind.IfStatementSyntax
  keyword: SyntaxToken,
  condition: ExpressionSyntax,
  body: StatementSyntax,
  elseClause?: ElseClause
}
export type MethodModifiers = never;
export type MethodStatementSyntax = {
  kind: SyntaxNodeKind.MethodStatementSyntax,
  modifiers: MethodModifiers[],
  keyword: SyntaxToken,
  identifier: SyntaxToken,
  parameters: ParametersSyntax[],
  body: BlockStatementSyntax,
  type: TypeClause,
}
export type ReturnStatementSyntax = {
  kind: SyntaxNodeKind.ReturnStatementSyntax,
  keyword: SyntaxToken,
  expression: ExpressionSyntax,
}
export type SemiColonSyntax = {
  kind: SyntaxNodeKind.SemiColonSyntax,
}
export type VariableStatementSyntax = {
  kind: SyntaxNodeKind.VariableStatementSyntax,
  keyword: SyntaxToken,
  identifier: SyntaxToken,
  equal?: SyntaxToken,
  init?: ExpressionSyntax,
}
export type WhileStatementSyntax = {
  kind: SyntaxNodeKind.WhileStatementSyntax
  keyword: SyntaxToken,
  condition: ExpressionSyntax,
  body: StatementSyntax,
}

export type EchoStatementSyntax = {
  kind: SyntaxNodeKind.EchoStatementSyntax,
  keyword: SyntaxToken,
  expression: ExpressionSyntax,
}