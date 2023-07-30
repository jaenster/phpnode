import {BoundExpression, BoundNameExpression} from "./bound-expression.js";
import {BoundFile, BoundLabel, BoundParameter} from "./bound-special.js";
import {BoundKind} from "./bound.node.js";
import {VariableSymbol} from "../symbols/symbols.js";
import {BoundModifiers} from "./bound-modifiers.js";

export type BoundStatement =
  | BoundBlockStatement
  | BoundBodyStatement
  | BoundBreakStatement
  | BoundContinueStatement
  | BoundExpressionStatement
  | BoundForStatement
  | BoundReturnStatement
  | BoundIfStatement
  | BoundJumpConditionalStatement
  | BoundJumpStatement
  | BoundFunctionStatement
  | BoundClassStatement
  | BoundPropertyStatement
  | BoundLabelStatement
  | BoundSemiColonStatement
  | BoundVariableStatement
  | BoundWhileStatement
  | BoundEchoStatement
  | BoundFile

export type BoundBlockStatement = {
  kind: BoundKind.BoundBlockStatement,
  statements: BoundStatement[];
}

export type BoundBodyStatement = {
  kind: BoundKind.BoundBodyStatement,
  statement: BoundStatement;
  break: BoundLabel;
  continue: BoundLabel;
}

export type BoundBreakStatement = {
  kind: BoundKind.BoundBreakStatement,
  label: BoundLabel,
}

export type BoundContinueStatement = {
  kind: BoundKind.BoundContinueStatement,
  label: BoundLabel,
}

export type BoundExpressionStatement = {
  kind: BoundKind.BoundExpressionStatement,
  expression: BoundExpression,
}
export type BoundEchoStatement = {
  kind: BoundKind.BoundEchoStatement,
  expression: BoundExpression,
}
export type BoundForStatement = {
  kind: BoundKind.BoundForStatement,
  init: BoundExpressionStatement | BoundVariableStatement,
  condition: BoundExpression,
  afterthought: BoundExpression,
  body: BoundBodyStatement,
}
export type BoundLabelStatement = {
  kind: BoundKind.BoundLabelStatement,
  label: BoundLabel,
}
export type BoundIfStatement = {
  kind: BoundKind.BoundIfStatement,
  condition: BoundExpression,
  body: BoundStatement,
  elseBody?: BoundStatement
}
export type BoundReturnStatement = {
  kind: BoundKind.BoundReturnStatement,
  expression: BoundExpression,
}
export type BoundJumpConditionalStatement = {
  kind: BoundKind.BoundJumpConditionalStatement,
  condition: BoundExpression,
  label: BoundLabel,
  onTrue: boolean,
}
export type BoundJumpStatement = {
  kind: BoundKind.BoundJumpStatement,
  label: BoundLabel,
}
export type BoundVariableStatement = {
  kind: BoundKind.BoundVariableStatement,
  variable: VariableSymbol,
  init: BoundExpression,
}
export type BoundWhileStatement = {
  kind: BoundKind.BoundWhileStatement,
  condition: BoundExpression,
  body: BoundBodyStatement,
}
export type BoundSemiColonStatement = {
  kind: BoundKind.BoundSemiColonStatement,
}
export type BoundFunctionStatement = {
  kind: BoundKind.BoundFunctionStatement,
  body: BoundStatement,
  parameters: BoundParameter[],
  modifiers: BoundModifiers,
  name: string,
}
export type BoundClassStatement = {
  kind: BoundKind.BoundClassStatement,
  name: string,
  methods: BoundFunctionStatement[],
  modifiers: BoundModifiers,
  properties: BoundPropertyStatement[],
}
export type BoundPropertyStatement = {
  kind: BoundKind.BoundPropertyStatement,
  modifiers: BoundModifiers,
  name: string,
}