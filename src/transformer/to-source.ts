import {SyntaxKind} from "../source/lexer.js";
import {BoundFile} from "../binder/bound-special.js";
import {
  BoundBlockStatement,
  BoundBodyStatement, BoundBreakStatement, BoundContinueStatement,
  BoundExpressionStatement,
  BoundForStatement,
  BoundIfStatement,
  BoundJumpConditionalStatement,
  BoundJumpStatement,
  BoundLabelStatement, BoundReturnStatement, BoundSemiColonStatement,
  BoundStatement, BoundVariableStatement, BoundWhileStatement
} from "../binder/bound-statement.js";
import {
  BoundAssignmentExpression,
  BoundBinaryExpression, BoundCommaExpression,
  BoundErrorExpression,
  BoundExpression, BoundLiteralExpression, BoundNameExpression, BoundUnaryExpression, BoundVariableExpression
} from "../binder/bound-expression.js";
import {BoundKind, BoundNode} from "../binder/bound.node.js";

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

  abstract toSourceVariableStatement(node: BoundVariableStatement): string

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

  toSourceStatement(statement: BoundStatement): string {
    switch (statement.kind) {
      case BoundKind.BoundSemiColonStatement:
        return this.toSourceSemiColonStatement(statement);
      case BoundKind.BoundBlockStatement:
        return this.toSourceBlockStatement(statement);
      case BoundKind.BoundBodyStatement:
        return this.toSourceBodyStatement(statement);
      case BoundKind.BoundBreakStatement:
        return this.toSourceBreakStatement(statement);
      case BoundKind.BoundContinueStatement:
        return this.toSourceContinueStatement(statement);
      case BoundKind.BoundExpressionStatement:
        return this.toSourceExpressionStatement(statement);
      case BoundKind.BoundForStatement:
        return this.toSourceForStatement(statement);
      case BoundKind.BoundReturnStatement:
        return this.toSourceReturnStatement(statement);
      case BoundKind.BoundIfStatement:
        return this.toSourceIfStatement(statement);
      case BoundKind.BoundJumpConditionalStatement:
        return this.toSourceJumpConditionalStatement(statement);
      case BoundKind.BoundJumpStatement:
        return this.toSourceJumpStatement(statement);
      case BoundKind.BoundLabelStatement:
        return this.toSourceLabelStatement(statement);
      case BoundKind.BoundVariableStatement:
        return this.toSourceVariableStatement(statement);
      case BoundKind.BoundWhileStatement:
        return this.toSourceWhileStatement(statement);
    }
    throw new Error('Did not implement '+BoundKind[statement.kind]);
  }
  toSourceExpression(node: BoundExpression): string {
    switch(node.kind) {
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
    }
    throw new Error('Did not implement '+BoundKind[node.kind]);
  }
}


