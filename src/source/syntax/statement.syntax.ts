import type {ElseClause, ParametersSyntax, TypeClause} from "./special.syntax.js";
import type {ExpressionSyntax} from "./expression.syntax.js";
import {SyntaxToken} from "../lexer.js";
import {SyntaxNodeKind} from "./syntax.node.js";
import {SyntaxKind} from "./syntax.kind.js";

export type StatementSyntax =
  | BlockStatementSyntax
  | BreakStatementSyntax
  | ContinueStatementSyntax
  | ExpressionStatementSyntax
  | ForStatementSyntax
  | IfStatementSyntax
  | FunctionStatementSyntax
  | ClassStatementSyntax
  | PropertyStatementSyntax
  | ReturnStatementSyntax
  | SemiColonSyntax
  | VariableStatementSyntax
  | WhileStatementSyntax
  | EchoStatementSyntax
  | PrintStatementSyntax
  | CaseStatementSyntax
  | SwitchStatementSyntax


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
  depth?: SyntaxToken,
}
export type ContinueStatementSyntax = {
  kind: SyntaxNodeKind.ContinueStatementSyntax,
  keyword: SyntaxToken,
  depth?: SyntaxToken,
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
export type FunctionStatementSyntax = {
  kind: SyntaxNodeKind.FunctionStatementSyntax,
  modifiers: SyntaxToken[],
  keyword: SyntaxToken,
  identifier: SyntaxToken,
  parameters: ParametersSyntax[],
  statements: StatementSyntax[],
  type: TypeClause,
  open: SyntaxToken,
  close: SyntaxToken,
}
export type ClassStatementSyntax = {
  kind: SyntaxNodeKind.ClassStatementSyntax,
  modifiers: SyntaxToken[]
  keyword: SyntaxToken,
  name: SyntaxToken,
  extend?: SyntaxToken,
  implements: SyntaxToken[]
  methods: FunctionStatementSyntax[],
  properties: PropertyStatementSyntax[],
}
export type PropertyStatementSyntax = {
  kind: SyntaxNodeKind.PropertyStatementSyntax,
  modifiers: SyntaxToken[],
  identifier: SyntaxToken,
  type: SyntaxToken,
  init?: ExpressionSyntax,
  equal?: SyntaxToken
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
export type PrintStatementSyntax = {
  kind: SyntaxNodeKind.PrintStatementSyntax,
  keyword: SyntaxToken,
  expression: ExpressionSyntax,
};

export type CaseStatementSyntax = {
  kind: SyntaxNodeKind.CaseStatementSyntax,
  keyword: SyntaxToken,
  expression: ExpressionSyntax,
  colon: SyntaxToken,
  statements: StatementSyntax[],
}

export type SwitchStatementSyntax = {
  kind: SyntaxNodeKind.SwitchStatementSyntax,
  keyword: SyntaxToken,
  expression: ExpressionSyntax,
  open: SyntaxToken,
  cases: CaseStatementSyntax[],
  close: SyntaxToken
};