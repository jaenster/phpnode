import {TypeSymbol, VariableSymbol} from "../symbols/symbols.js";
import {BoundBinaryOperator, BoundUnaryOperator} from "./bound-operator.js";
import {BoundKind, BoundNodeTypes} from "./bound.node.js";
import {BoundClassStatement, BoundFunctionStatement} from "./bound-statement.js";
import {Modifiers} from "../source/syntax/syntax.facts.js";

export type BoundExpression = (
  | BoundAssignmentExpression
  | BoundBinaryExpression
  | BoundCallExpression
  | BoundEmptyExpression
  | BoundErrorExpression
  | BoundNameExpression
  | BoundCommaExpression
  | BoundLiteralExpression
  | BoundUnaryExpression
  | BoundVariableExpression
  | BoundParenExpression
  | BoundArrayLiteralExpression
  | BoundJavascriptLiteralArrayExpression

  // Some statements are valid expressions
  | BoundClassStatement
  | BoundFunctionStatement
  ) & { parent?: BoundNodeTypes }

export type BoundParenExpression = {
  kind: BoundKind.BoundParenExpression,
  type: TypeSymbol,
  expression: BoundExpression,
}
export type BoundAssignmentExpression = {
  kind: BoundKind.BoundAssignmentExpression,
  type: TypeSymbol,
  variable: VariableSymbol,
  expression: BoundExpression,
}
export type BoundBinaryExpression = {
  kind: BoundKind.BoundBinaryExpression
  type: TypeSymbol,
  left: BoundExpression,
  right: BoundExpression,
  operator: BoundBinaryOperator,
  modifiers: Modifiers,
}
export type BoundCommaExpression = {
  kind: BoundKind.BoundCommaExpression,
  type: TypeSymbol,
  expressions: BoundExpression[],
}
export type BoundErrorExpression = {
  kind: BoundKind.BoundErrorExpression,
  type: TypeSymbol,
}
export type BoundLiteralExpression = {
  kind: BoundKind.BoundLiteralExpression,
  type: TypeSymbol,
  value: any,
}
// Used for function calls without any arguments (), it's an empty comma expression
export type BoundEmptyExpression = {
  kind: BoundKind.BoundEmptyExpression,
  type: TypeSymbol,
}
export type BoundNameExpression = {
  kind: BoundKind.BoundNameExpression,
  type: TypeSymbol,
  variable: VariableSymbol,
  modifiers: Modifiers,
}
export type BoundUnaryExpression = {
  kind: BoundKind.BoundUnaryExpression,
  type: TypeSymbol,
  operator: BoundUnaryOperator,
  operand: BoundExpression,
}
export type BoundVariableExpression = {
  kind: BoundKind.BoundVariableExpression,
  type: TypeSymbol,
  variable: VariableSymbol,
}
export type BoundCallExpression = {
  kind: BoundKind.BoundVariableExpression,
  type: TypeSymbol,
  variable: VariableSymbol,
}
export type BoundArrayLiteralExpression = {
  kind: BoundKind.BoundArrayLiteralExpression,
  type: TypeSymbol,
  expressions: BoundExpression[],
}
export type BoundJavascriptLiteralArrayExpression = {
  kind: BoundKind.BoundJavascriptLiteralArrayExpression,
  type: TypeSymbol,
  expressions: BoundExpression[],
}