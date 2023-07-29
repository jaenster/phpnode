
import type {TypeSymbol} from "../symbols/symbols.js";
import type {SyntaxNodeKind} from "./syntax.node.js";
import {SyntaxNode} from "./syntax.node.js";
import {SyntaxToken} from "./lexer.js";


export type ExpressionSyntax = (
  | AssignmentExpressionSyntax
  | BinaryExpressionSyntax
  | CommaExpressionSyntax
  | EmptyExpressionSyntax
  | LiteralExpressionSyntax
  | NameExpressionSyntax
  | ParenExpressionSyntax
  | UnaryExpressionSyntax
)

export type AssignmentExpressionSyntax = {
  kind: SyntaxNodeKind.AssignmentExpressionSyntax,
  identifier: SyntaxToken,
  operator: SyntaxToken,
  expression: ExpressionSyntax&SyntaxNode,
}

export type BinaryExpressionSyntax = {
  kind: SyntaxNodeKind.BinaryExpressionSyntax,
  left: ExpressionSyntax&SyntaxNode,
  operator: SyntaxToken,
  right: ExpressionSyntax&SyntaxNode
}

export type CommaExpressionSyntax = {
  kind: SyntaxNodeKind.CommaExpressionSyntax,
  expressions: ExpressionSyntax[],
}

export type EmptyExpressionSyntax = {
  kind: SyntaxNodeKind.EmptyExpressionSyntax,
  type: TypeSymbol,
}

export type LiteralExpressionSyntax = {
  kind: SyntaxNodeKind.LiteralExpressionSyntax,
  keyword?: SyntaxToken,
  value: any,
  type: TypeSymbol,
}

export type NameExpressionSyntax = {
  kind: SyntaxNodeKind.NameExpressionSyntax,
  id: SyntaxToken,
}

export type ParenExpressionSyntax = {
  kind: SyntaxNodeKind.ParenExpressionSyntax,
  left: SyntaxToken,
  expression: ExpressionSyntax,
  right: SyntaxToken,
}

export type UnaryExpressionSyntax = {
  kind: SyntaxNodeKind.UnaryExpressionSyntax,
  operator: SyntaxToken,
  operand: ExpressionSyntax,
  post: boolean,
}
