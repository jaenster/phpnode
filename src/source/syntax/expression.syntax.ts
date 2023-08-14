
import type {TypeSymbol} from "../../symbols/symbols.js";
import type {SyntaxNodeKind} from "./syntax.node.js";
import {SyntaxNode} from "./syntax.node.js";
import {SyntaxToken} from "../lexer.js";


export type ExpressionSyntax = (
  | BinaryExpressionSyntax
  | CommaExpressionSyntax
  | EmptyExpressionSyntax
  | LiteralExpressionSyntax
  | NameExpressionSyntax
  | ParenExpressionSyntax
  | UnaryExpressionSyntax
  | ArrayLiteralExpressionSyntax
)

export type BinaryExpressionSyntax = {
  kind: SyntaxNodeKind.BinaryExpressionSyntax,
  left: ExpressionSyntax&SyntaxNode,
  operator: SyntaxToken,
  right: ExpressionSyntax&SyntaxNode,
}

export type CommaExpressionSyntax = {
  kind: SyntaxNodeKind.CommaExpressionSyntax,
  expressions: ExpressionSyntax[],
  commas: SyntaxToken[]
}

export type EmptyExpressionSyntax = {
  kind: SyntaxNodeKind.EmptyExpressionSyntax,
  type: TypeSymbol,
}

export type LiteralExpressionSyntax = {
  kind: SyntaxNodeKind.LiteralExpressionSyntax,
  value: any,
  token: SyntaxToken,
  type: TypeSymbol,
}

export type NameExpressionSyntax = {
  kind: SyntaxNodeKind.NameExpressionSyntax,
  identifier: SyntaxToken,
}

export type ParenExpressionSyntax = {
  kind: SyntaxNodeKind.ParenExpressionSyntax,
  open: SyntaxToken,
  expression: ExpressionSyntax,
  close: SyntaxToken,
}

export type UnaryExpressionSyntax = {
  kind: SyntaxNodeKind.UnaryExpressionSyntax,
  operator: SyntaxToken,
  operand: ExpressionSyntax,
  post: boolean,
}

export type ArrayLiteralExpressionSyntax = {
  kind: SyntaxNodeKind.ArrayLiteralExpressionSyntax,
  open: SyntaxToken,
  close: SyntaxToken,
  members: ExpressionSyntax,
}