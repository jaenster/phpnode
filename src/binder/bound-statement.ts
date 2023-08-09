import {BoundExpression} from "./bound-expression.js";
import {BoundFile, BoundLabel, BoundParameter} from "./bound-special.js";
import {BoundKind, BoundNodeTypes, BoundSpanBase} from "./bound.node.js";
import {TypeSymbol} from "../symbols/symbols.js";
import {BoundScope} from "./bound-scope.js";
import {Modifiers} from "../source/syntax/syntax.facts.js";

export type BoundStatement = (
  | BoundBlockStatement
  | BoundBodyStatement
  | BoundBreakStatement
  | BoundCaseStatement
  | BoundClassStatement
  | BoundContinueStatement
  | BoundEchoStatement
  | BoundExpressionStatement
  | BoundFile
  | BoundForStatement
  | BoundFunctionStatement
  | BoundIfStatement
  | BoundJumpConditionalStatement
  | BoundJumpStatement
  | BoundLabelStatement
  | BoundMethodStatement
  | BoundPropertyStatement
  | BoundReturnStatement
  | BoundSemiColonStatement
  | BoundSwitchStatement
  | BoundWhileStatement
  ) & { parent?: BoundNodeTypes }

export type BoundBlockStatement = BoundSpanBase & { kind: BoundKind.BoundBlockStatement, statements: BoundStatement[]; }
export type BoundBodyStatement = BoundSpanBase & {
  kind: BoundKind.BoundBodyStatement,
  statement: BoundStatement;
  break: BoundLabel;
  continue: BoundLabel;
}
export type BoundBreakStatement = BoundSpanBase & {
  kind: BoundKind.BoundBreakStatement,
  label: BoundLabel,
  depth: number,
}
export type BoundCaseStatement = BoundSpanBase & {
  kind: BoundKind.BoundCaseStatement,
  expression: BoundExpression,
  statements: BoundStatement[],
};
export type BoundClassStatement = BoundSpanBase & {
  kind: BoundKind.BoundClassStatement,
  name: string,
  methods: BoundMethodStatement[],
  modifiers: Modifiers,
  properties: BoundPropertyStatement[],
  type: TypeSymbol,
  scope: BoundScope,
}
export type BoundContinueStatement = BoundSpanBase & {
  kind: BoundKind.BoundContinueStatement,
  label: BoundLabel,
  depth: number,
}
export type BoundEchoStatement = BoundSpanBase & { kind: BoundKind.BoundEchoStatement, expression: BoundExpression, }
export type BoundExpressionStatement = BoundSpanBase & {
  kind: BoundKind.BoundExpressionStatement,
  expression: BoundExpression,
}
export type BoundForStatement = BoundSpanBase & {
  kind: BoundKind.BoundForStatement,
  init: BoundExpression,
  condition: BoundExpression,
  afterthought: BoundExpression,
  body: BoundBodyStatement,
}
export type BoundFunctionStatement = BoundSpanBase & {
  kind: BoundKind.BoundFunctionStatement,
  statements: BoundStatement[],
  parameters: BoundParameter[],
  type: TypeSymbol,
  name?: string,
  scope: BoundScope,
  modifiers: Modifiers,
}
export type BoundIfStatement = BoundSpanBase & {
  kind: BoundKind.BoundIfStatement,
  condition: BoundExpression,
  body: BoundStatement,
  elseBody?: BoundStatement
}
export type BoundJumpConditionalStatement = BoundSpanBase & {
  kind: BoundKind.BoundJumpConditionalStatement,
  condition: BoundExpression,
  label: BoundLabel,
  onTrue: boolean,
}
export type BoundJumpStatement = BoundSpanBase & { kind: BoundKind.BoundJumpStatement, label: BoundLabel, }
export type BoundLabelStatement = BoundSpanBase & { kind: BoundKind.BoundLabelStatement, label: BoundLabel, }
export type BoundMethodStatement = Omit<BoundFunctionStatement, 'kind'> & { kind: BoundKind.BoundMethodStatement }
export type BoundPropertyStatement = BoundSpanBase & {
  kind: BoundKind.BoundPropertyStatement,
  modifiers: Modifiers,
  name: string,
  init?: BoundExpression;
}
export type BoundReturnStatement = BoundSpanBase & {
  kind: BoundKind.BoundReturnStatement,
  expression: BoundExpression,
}
export type BoundSemiColonStatement = BoundSpanBase & { kind: BoundKind.BoundSemiColonStatement, }
export type BoundSwitchStatement = BoundSpanBase & {
  kind: BoundKind.BoundSwitchStatement,
  expression: BoundExpression,
  cases: BoundCaseStatement[],
  break: BoundLabel,
  continue: BoundLabel,
};
export type BoundWhileStatement = BoundSpanBase & {
  kind: BoundKind.BoundWhileStatement,
  condition: BoundExpression,
  body: BoundBodyStatement,
}