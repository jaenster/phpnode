import type {StatementSyntax} from "./statement.syntax.js";
import {SyntaxNodeKind} from "./syntax.node.js";
import {SyntaxToken} from "../lexer.js";

export type SpecialSyntax =
  | FileSyntax
  | ParametersSyntax
  | TypeClause
  | ElseClause


export type ElseClause = {
  kind: SyntaxNodeKind.ElseClauseSyntax,
  keyword: SyntaxToken,
  body: StatementSyntax,
}

export type TypeClause = {
  kind: SyntaxNodeKind.TypeClause,
  identifier: SyntaxToken,
}

export type ParametersSyntax = {
  kind: SyntaxNodeKind.ParameterSyntax
  name: SyntaxToken,
  type: SyntaxToken,
}

export type FileSyntax = {
  kind: SyntaxNodeKind.FileSyntax
  filename: string,
  depended: FileSyntax[],
  body: StatementSyntax[],
}