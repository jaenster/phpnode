import {TypeSymbol, VariableSymbol} from "../symbols/symbols.js";
import {BoundBinaryOperator, BoundUnaryOperator} from "./bound-operator.js";
import {BoundKind} from "./bound.node.js";
import {BoundClassStatement, BoundFunctionStatement} from "./bound-statement.js";

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

  // Some statements are valid expressions
  | BoundClassStatement
  | BoundFunctionStatement
  )
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