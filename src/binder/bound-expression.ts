import {TypeSymbol, VariableSymbol} from "../symbols/symbols.js";
import {BoundBinaryOperator, BoundUnaryOperator} from "./bound-operator.js";
import {BoundKind, BoundNodeTypes, BoundSpanBase} from "./bound.node.js";
import {BoundClassStatement, BoundFunctionStatement} from "./bound-statement.js";
import {Modifiers} from "../source/syntax/syntax.facts.js";

export type BoundExpression = (
  | BoundArrayLiteralExpression
  | BoundAssignmentExpression
  | BoundBinaryExpression
  | BoundCallExpression
  | BoundClassStatement
  | BoundCommaExpression
  | BoundEmptyExpression
  | BoundErrorExpression
  | BoundFunctionStatement
  | BoundJavascriptLiteralArrayExpression
  | BoundLiteralExpression
  | BoundNameExpression
  | BoundParenExpression
  | BoundUnaryExpression
  | BoundVariableExpression
  ) & { parent?: BoundNodeTypes }

export type BoundArrayLiteralExpression = BoundSpanBase & {
  kind: BoundKind.BoundArrayLiteralExpression,
  type: TypeSymbol,
  expressions: BoundExpression[],
}
export type BoundAssignmentExpression = BoundSpanBase & {
  kind: BoundKind.BoundAssignmentExpression,
  type: TypeSymbol,
  variable: VariableSymbol,
  expression: BoundExpression,
  isArray: boolean,
}
export type BoundBinaryExpression = BoundSpanBase & {
  kind: BoundKind.BoundBinaryExpression,
  type: TypeSymbol,
  left: BoundExpression,
  right: BoundExpression,
  operator: BoundBinaryOperator,
  modifiers: Modifiers,
}
export type BoundCallExpression = BoundSpanBase & {
  kind: BoundKind.BoundVariableExpression,
  type: TypeSymbol,
  variable: VariableSymbol,
}
export type BoundCommaExpression = BoundSpanBase & {
  kind: BoundKind.BoundCommaExpression,
  type: TypeSymbol,
  expressions: BoundExpression[],
}
export type BoundEmptyExpression = BoundSpanBase & { kind: BoundKind.BoundEmptyExpression, type: TypeSymbol, }
export type BoundErrorExpression = BoundSpanBase & { kind: BoundKind.BoundErrorExpression, type: TypeSymbol, }
export type BoundJavascriptLiteralArrayExpression = BoundSpanBase & {
  kind: BoundKind.BoundJavascriptLiteralArrayExpression,
  type: TypeSymbol,
  expressions: BoundExpression[],
}
export type BoundLiteralExpression = BoundSpanBase & {
  kind: BoundKind.BoundLiteralExpression,
  type: TypeSymbol,
  value: any,
}
export type BoundNameExpression = BoundSpanBase & {
  kind: BoundKind.BoundNameExpression,
  type: TypeSymbol,
  variable: VariableSymbol,
  modifiers: Modifiers,
}
export type BoundParenExpression = BoundSpanBase & {
  kind: BoundKind.BoundParenExpression,
  type: TypeSymbol,
  expression: BoundExpression,
}
export type BoundUnaryExpression = BoundSpanBase & {
  kind: BoundKind.BoundUnaryExpression,
  type: TypeSymbol,
  operator: BoundUnaryOperator,
  operand: BoundExpression,
}
export type BoundVariableExpression = BoundSpanBase & {
  kind: BoundKind.BoundVariableExpression,
  type: TypeSymbol,
  variable: VariableSymbol,
}
