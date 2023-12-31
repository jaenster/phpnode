import {BoundFile} from "../binder/bound-special.js";
import {
  BoundBlockStatement,
  BoundBodyStatement, BoundBreakStatement, BoundCaseStatement, BoundClassStatement, BoundContinueStatement,
  BoundExpressionStatement,
  BoundForStatement, BoundFunctionStatement,
  BoundIfStatement,
  BoundJumpConditionalStatement,
  BoundJumpStatement,
  BoundLabelStatement, BoundMethodStatement, BoundPropertyStatement, BoundReturnStatement, BoundSemiColonStatement,
  BoundStatement, BoundSwitchStatement, BoundWhileStatement
} from "../binder/bound-statement.js";
import {
  BoundAssignmentExpression,
  BoundBinaryExpression,
  BoundCommaExpression,
  BoundEmptyExpression,
  BoundExpression, BoundJavascriptLiteralArrayExpression,
  BoundLiteralExpression,
  BoundNameExpression,
  BoundParenExpression,
  BoundUnaryExpression,
  BoundVariableExpression
} from "../binder/bound-expression.js";
import {BoundKind} from "../binder/bound.node.js";

export abstract class ToSource {
  abstract toSourceFileStatement(node: BoundFile): string;

  abstract toSourceBodyStatement(node: BoundBodyStatement): string

  abstract toSourceBlockStatement(node: BoundBlockStatement): string

  abstract toSourceExpressionStatement(node: BoundExpressionStatement): string

  abstract toSourceForStatement(node: BoundForStatement): string

  abstract toSourceIfStatement(node: BoundIfStatement): string

  abstract toSourceJumpConditionalStatement(node: BoundJumpConditionalStatement): string

  abstract toSourceJumpStatement(node: BoundJumpStatement): string

  abstract toSourceLabelStatement(node: BoundLabelStatement): string

  abstract toSourceWhileStatement(node: BoundWhileStatement): string

  abstract toSourceSemiColonStatement(node: BoundSemiColonStatement): string

  abstract toSourceBreakStatement(node: BoundBreakStatement): string

  abstract toSourceContinueStatement(node: BoundContinueStatement): string

  abstract toSourceAssignmentExpression(node: BoundAssignmentExpression): string

  abstract toSourceBinaryExpression(node: BoundBinaryExpression): string

  abstract toSourceVariableExpression(node: BoundVariableExpression): string

  abstract toSourceNameExpression(node: BoundNameExpression): string

  abstract toSourceCommaExpression(node: BoundCommaExpression): string

  abstract toSourceLiteralExpression(node: BoundLiteralExpression): string

  abstract toSourceUnaryExpression(node: BoundUnaryExpression): string

  abstract toSourceReturnStatement(node: BoundReturnStatement): string

  abstract toSourceMethodStatement(node: BoundMethodStatement): string

  abstract toSourceFunctionStatement(node: BoundFunctionStatement): string

  abstract toSourceProperty(property: BoundPropertyStatement): string

  abstract toSourceClassStatement(statement: BoundClassStatement): string

  abstract toSourceEmptyExpression(statement: BoundEmptyExpression): string

  abstract toSourceJavascriptLiteralArrayExpression(statement: BoundJavascriptLiteralArrayExpression): string

  toSourceStatement(node: BoundStatement): string {
    switch (node.kind) {
      case BoundKind.BoundSemiColonStatement:
        return this.toSourceSemiColonStatement(node);
      case BoundKind.BoundBlockStatement:
        return this.toSourceBlockStatement(node);
      case BoundKind.BoundBodyStatement:
        return this.toSourceBodyStatement(node);
      case BoundKind.BoundBreakStatement:
        return this.toSourceBreakStatement(node);
      case BoundKind.BoundContinueStatement:
        return this.toSourceContinueStatement(node);
      case BoundKind.BoundExpressionStatement:
        return this.toSourceExpressionStatement(node);
      case BoundKind.BoundForStatement:
        return this.toSourceForStatement(node);
      case BoundKind.BoundReturnStatement:
        return this.toSourceReturnStatement(node);
      case BoundKind.BoundIfStatement:
        return this.toSourceIfStatement(node);
      case BoundKind.BoundJumpConditionalStatement:
        return this.toSourceJumpConditionalStatement(node);
      case BoundKind.BoundJumpStatement:
        return this.toSourceJumpStatement(node);
      case BoundKind.BoundLabelStatement:
        return this.toSourceLabelStatement(node);
      case BoundKind.BoundWhileStatement:
        return this.toSourceWhileStatement(node);
      case BoundKind.BoundClassStatement:
        return this.toSourceClassStatement(node);
      // Statements that are valid expressions
      case BoundKind.BoundMethodStatement:
        return this.toSourceMethodStatement(node);
      case BoundKind.BoundSwitchStatement:
        return this.toSourceSwitchStatement(node);
    }
    throw new Error('Did not implement ' + BoundKind[node.kind]);
  }

  toSourceExpression(node: BoundExpression): string {
    switch (node.kind) {
      case BoundKind.BoundAssignmentExpression:
        return this.toSourceAssignmentExpression(node);
      case BoundKind.BoundBinaryExpression:
        return this.toSourceBinaryExpression(node);
      case BoundKind.BoundVariableExpression:
        return this.toSourceVariableExpression(node);
      case BoundKind.BoundNameExpression:
        return this.toSourceNameExpression(node);
      case BoundKind.BoundCommaExpression:
        return this.toSourceCommaExpression(node);
      case BoundKind.BoundLiteralExpression:
        return this.toSourceLiteralExpression(node);
      case BoundKind.BoundUnaryExpression:
        return this.toSourceUnaryExpression(node);
      case BoundKind.BoundFunctionStatement:
        return this.toSourceFunctionStatement(node);
      case BoundKind.BoundClassStatement:
        return this.toSourceClassStatement(node);
      case BoundKind.BoundEmptyExpression:
        return this.toSourceEmptyExpression(node);
      case BoundKind.BoundParenExpression:
        return this.toSourceParenExpression(node);
      case BoundKind.BoundJavascriptLiteralArrayExpression:
        return this.toSourceJavascriptLiteralArrayExpression(node);
    }
    throw new Error('Did not implement ' + BoundKind[node.kind]);
  }

  abstract toSourceParenExpression(node: BoundParenExpression): string


  abstract toSourceSwitchStatement(node: BoundSwitchStatement): string
  abstract toSourceCaseStatement(node: BoundCaseStatement): string
}


