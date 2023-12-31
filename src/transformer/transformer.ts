import {
  BoundBlockStatement,
  BoundBodyStatement,
  BoundBreakStatement,
  BoundCaseStatement,
  BoundClassStatement,
  BoundContinueStatement,
  BoundEchoStatement,
  BoundExpressionStatement,
  BoundForStatement,
  BoundFunctionStatement,
  BoundIfStatement,
  BoundJumpConditionalStatement,
  BoundJumpStatement,
  BoundLabelStatement,
  BoundMethodStatement,
  BoundPropertyStatement,
  BoundReturnStatement,
  BoundSemiColonStatement,
  BoundStatement,
  BoundSwitchStatement,
  BoundWhileStatement
} from "../binder/bound-statement.js";
import {
  BoundKind,
  BoundNode,
  createBoundExpression,
  createBoundStatement
} from "../binder/bound.node.js";
import {
  BoundArrayLiteralExpression,
  BoundAssignmentExpression,
  BoundBinaryExpression,
  BoundCommaExpression,
  BoundErrorExpression,
  BoundExpression,
  BoundLiteralExpression,
  BoundNameExpression,
  BoundParenExpression,
  BoundUnaryExpression,
  BoundVariableExpression
} from "../binder/bound-expression.js";
import {BoundFile} from "../binder/bound-special.js";
import {TypeSymbol} from "../symbols/symbols.js";
import {BoundBinaryOperator} from "../binder/bound-operator.js";

export abstract class Transformer {
  public currentBinaryOperator?: BoundBinaryOperator;
  public currentFunction: BoundFunctionStatement | BoundMethodStatement;

  transformFile(node: BoundFile): BoundFile & BoundNode {
    let changed = false
    const statements: BoundStatement[] = [];
    for (let i = 0; i < node.statements.length; i++) {
      const statement = node.statements[i];
      const newStatement = this.transformStatement(statement);
      statements.push(newStatement);
      changed ||= newStatement !== statement;
    }

    if (changed) {
      const filename = node.filename;
      return createBoundStatement({kind: BoundKind.BoundFile, statements, filename, scope: node.scope});
    }

    return node as BoundFile & BoundNode;
  }

  transformStatement(statement: BoundStatement) {
    if (statement) switch (statement.kind) {
      case BoundKind.BoundClassStatement:
        return this.transformClassStatement(statement);
      case BoundKind.BoundBlockStatement:
        return this.transformBlockStatement(statement);
      case BoundKind.BoundBodyStatement:
        return this.transformBodyStatement(statement);
      case BoundKind.BoundExpressionStatement:
        return this.transformExpressionStatement(statement);
      case BoundKind.BoundForStatement:
        return this.transformForStatement(statement);
      case BoundKind.BoundIfStatement:
        return this.transformIfStatement(statement);
      case BoundKind.BoundJumpConditionalStatement:
        return this.transformJumpConditionalStatement(statement);
      case BoundKind.BoundJumpStatement:
        return this.transformJumpStatement(statement);
      case BoundKind.BoundLabelStatement:
        return this.transformLabelStatement(statement);
      case BoundKind.BoundWhileStatement:
        return this.transformWhileStatement(statement);
      case BoundKind.BoundSemiColonStatement:
        return this.transformSemiColonStatement(statement);
      case BoundKind.BoundBreakStatement:
        return this.transformBreakStatement(statement);
      case BoundKind.BoundContinueStatement:
        return this.transformContinueStatement(statement);
      case BoundKind.BoundReturnStatement:
        return this.transformReturnStatement(statement);
      case BoundKind.BoundEchoStatement:
        return this.transformEchoStatement(statement);
      case BoundKind.BoundSwitchStatement:
        return this.transformSwitchStatement(statement);
    }
    throw new Error(`Unexpected ${BoundKind[statement.kind]}`);
  }

  transformCaseStatement(node: BoundCaseStatement): BoundCaseStatement {
    const expression = this.transformExpression(node.expression);
    const statements: BoundStatement[] = []

    let isNew = expression !== node.expression;
    for (const member of node.statements) {
      const other = this.transformStatement(member);
      isNew ||= other !== member;
      statements.push(other);
    }

    if (isNew) {
      return createBoundStatement({
        kind: BoundKind.BoundCaseStatement,
        expression,
        statements,
        tokens: node.tokens,
      })
    }
    return node;
  }

  transformSwitchStatement(node: BoundSwitchStatement) {
    const expression = this.transformExpression(node.expression);
    const cases: BoundCaseStatement[] = []

    let isNew = expression !== node.expression;
    for (const member of node.cases) {
      const other = this.transformCaseStatement(member);
      isNew ||= other !== member;
      cases.push(other);
    }

    if (isNew) {
      return createBoundStatement({
        kind: BoundKind.BoundSwitchStatement,
        expression,
        cases,
        break: node.break,
        continue: node.continue,
        tokens: node.tokens,
      })
    }
    return node;
  }

  transformEchoStatement(node: BoundEchoStatement): BoundStatement {
    const expression = this.transformExpression(node.expression);

    if (expression !== node.expression) {
      return createBoundStatement({kind: BoundKind.BoundEchoStatement, expression, tokens: node.tokens});
    }
    return node;
  }

  transformBodyStatement(node: BoundBodyStatement): BoundBodyStatement {
    const statement = this.transformStatement(node.statement);

    if (statement !== node.statement) {
      return createBoundStatement({
        kind: BoundKind.BoundBodyStatement,
        statement,
        break: node.break,
        continue: node.continue,
        tokens: node.tokens,
      })
    }

    return node;
  }

  transformBlockStatement(node: BoundBlockStatement): BoundStatement {
    let changed = false
    const statements: BoundStatement[] = [];
    for (let i = 0; i < node.statements.length; i++) {
      const statement = node.statements[i];
      const newStatement = this.transformStatement(statement);
      statements.push(newStatement);
      changed ||= newStatement !== statement;
    }

    if (changed) {
      return createBoundStatement({kind: BoundKind.BoundBlockStatement, statements, tokens: node.tokens});
    }

    return node;
  }

  transformExpressionStatement(node: BoundExpressionStatement): BoundExpressionStatement {
    const expression = this.transformExpression(node.expression);

    if (expression !== node.expression) {
      return createBoundStatement({kind: BoundKind.BoundExpressionStatement, expression, tokens: node.tokens,});
    }
    return node;
  }

  transformForStatement(node: BoundForStatement): BoundStatement {
    const init = this.transformExpression(node.init);

    const condition = this.transformExpression(node.condition);
    const afterthought = this.transformExpression(node.afterthought)
    const body = this.transformBodyStatement(node.body);

    if (init !== node.init || condition !== node.condition || afterthought !== node.afterthought || body !== node.body) {
      return createBoundStatement({
        kind: BoundKind.BoundForStatement,
        init,
        condition,
        body,
        afterthought,
        tokens: node.tokens,
      });
    }

    return node;
  }

  transformIfStatement(node: BoundIfStatement): BoundStatement {
    const condition = this.transformExpression(node.condition);
    const body = this.transformStatement(node.body);
    const elseBody = node.elseBody ? this.transformStatement(node.elseBody) : null;

    if (condition !== node.condition || body !== node.body || elseBody !== node.elseBody) {
      return createBoundStatement({kind: BoundKind.BoundIfStatement, condition, body, elseBody, tokens: node.tokens,});
    }
    return node;
  }

  transformJumpConditionalStatement(node: BoundJumpConditionalStatement): BoundStatement {
    const condition = this.transformExpression(node.condition);

    if (condition !== node.condition) {
      return createBoundStatement({
        kind: BoundKind.BoundJumpConditionalStatement,
        condition,
        label: node.label,
        onTrue: node.onTrue,
        tokens: node.tokens,
      });
    }
    return node;
  }

  transformJumpStatement(node: BoundJumpStatement): BoundStatement {
    return node;
  }

  transformLabelStatement(node: BoundLabelStatement): BoundStatement {
    return node;
  }

  transformWhileStatement(node: BoundWhileStatement): BoundStatement {
    const condition = this.transformExpression(node.condition);
    const body = this.transformBodyStatement(node.body);

    if (condition !== node.condition || body !== node.body) {
      return createBoundStatement({kind: BoundKind.BoundWhileStatement, condition, body, tokens: node.tokens,});
    }

    return node;
  }

  transformSemiColonStatement(node: BoundSemiColonStatement): BoundStatement {
    return node;
  }

  transformBreakStatement(node: BoundBreakStatement): BoundStatement {
    return node;
  }

  transformContinueStatement(node: BoundContinueStatement): BoundStatement {
    return node;
  }

  // Expressions
  transformExpression(node: BoundExpression): BoundExpression {
    if (node) switch (node.kind) {
      case BoundKind.BoundEmptyExpression:
        return node;
      case BoundKind.BoundClassStatement:
        return this.transformClassStatement(node);
      case BoundKind.BoundFunctionStatement:
        return this.transformFunction(node);
      case BoundKind.BoundErrorExpression:
        return this.transformErrorExpression(node);
      case BoundKind.BoundAssignmentExpression:
        return this.transformAssignmentExpression(node);
      case BoundKind.BoundBinaryExpression:
        return this.transformBinaryExpression(node);
      case BoundKind.BoundVariableExpression:
        return this.transformVariableExpression(node);
      case BoundKind.BoundNameExpression:
        return this.transformNameExpression(node);
      case BoundKind.BoundCommaExpression:
        return this.transformCommaExpression(node);
      case BoundKind.BoundLiteralExpression:
        return this.transformLiteralExpression(node);
      case BoundKind.BoundUnaryExpression:
        return this.transformUnaryExpression(node);
      case BoundKind.BoundParenExpression:
        return this.transformParenExpression(node)
      case BoundKind.BoundArrayLiteralExpression:
        return this.transformArrayLiteralExpression(node);
      case BoundKind.BoundJavascriptLiteralArrayExpression:
        return node;
    }
    throw new Error('Unexpected expression ' + BoundKind[node?.kind]);
  }

  transformParenExpression(node: BoundParenExpression): BoundExpression {
    const expression = this.transformExpression(node.expression);

    if (expression !== node.expression) {
      return createBoundExpression({
        kind: BoundKind.BoundParenExpression,
        expression,
        type: expression.type,
        tokens: node.tokens,
      });
    }
    return node;
  }

  transformErrorExpression(node: BoundErrorExpression) {
    return node;
  }

  transformAssignmentExpression(node: BoundAssignmentExpression): BoundExpression {
    const expression = this.transformExpression(node.expression)
    if (expression !== node.expression) {
      return createBoundExpression({
        kind: BoundKind.BoundAssignmentExpression,
        type: node.variable.type,
        expression,
        variable: node.variable,
        tokens: node.tokens,
        isArray: node.isArray,
      });
    }
    return node;
  }

  transformBinaryExpression(node: BoundBinaryExpression): BoundExpression {
    const left = this.transformExpression(node.left);

    const lastOperator = this.currentBinaryOperator;
    const operator = this.currentBinaryOperator = node.operator;
    const right = this.transformExpression(node.right);

    this.currentBinaryOperator = lastOperator;
    if (right !== node.right || operator !== node.operator || left !== node.left) {
      return createBoundExpression({
        kind: BoundKind.BoundBinaryExpression,
        type: operator.resultType,
        left,
        operator,
        right,
        modifiers: node.modifiers,
        tokens: node.tokens,
      })
    }
    return node;
  }

  transformVariableExpression(node: BoundVariableExpression): BoundExpression {
    return node;
  }

  transformNameExpression(node: BoundNameExpression): BoundExpression {
    return node;
  }

  transformCommaExpression(node: BoundCommaExpression): BoundExpression {
    let changed = false
    const expressions: BoundExpression[] = [];
    for (let i = 0; i < node.expressions.length; i++) {
      const expression = node.expressions[i];
      const newExpression = this.transformExpression(expression);
      expressions.push(newExpression);
      changed ||= newExpression !== expression;
    }

    if (changed) {
      const last = expressions[expressions.length - 1]
      return createBoundExpression({
        kind: BoundKind.BoundCommaExpression,
        type: last.type ?? TypeSymbol.void,
        expressions,
        tokens: node.tokens,
      });
    }

    return node;
  }

  transformLiteralExpression(node: BoundLiteralExpression): BoundExpression {
    return node;
  }

  transformUnaryExpression(node: BoundUnaryExpression): BoundExpression {
    const operand = this.transformExpression(node.operand);

    if (operand !== node.operand) {
      return createBoundExpression({
        kind: BoundKind.BoundUnaryExpression,
        type: node.operator.resultType,
        operator: node.operator,
        operand,
        tokens: node.tokens,
      })
    }

    return node;
  }

  transformReturnStatement(node: BoundReturnStatement) {
    const expression = node.expression ? this.transformExpression(node.expression) : node.expression;
    if (expression !== node.expression) {
      return createBoundStatement({
        kind: BoundKind.BoundReturnStatement,
        expression,
        tokens: node.tokens,
      });
    }

    return node;
  }


  transformFunction(node: BoundFunctionStatement): BoundFunctionStatement {
    let changed = false
    const statements: BoundStatement[] = [];

    const last = this.currentFunction;
    this.currentFunction = node;

    for (let i = 0; i < node.statements.length; i++) {
      const statement = node.statements[i];
      const newStatement = this.transformStatement(statement);
      statements.push(newStatement);
      changed ||= newStatement !== statement;
    }

    this.currentFunction = last;
    if (changed) {
      return createBoundStatement({
        kind: BoundKind.BoundFunctionStatement,
        statements,
        parameters: node.parameters,
        name: node.name,
        type: node.type,
        scope: node.scope,
        modifiers: node.modifiers,
        tokens: node.tokens,
      })
    }
    return node;
  }

  transformMethod(node: BoundMethodStatement): BoundMethodStatement {
    let changed = false
    const statements: BoundStatement[] = [];

    const last = this.currentFunction;
    this.currentFunction = node;

    for (let i = 0; i < node.statements.length; i++) {
      const statement = node.statements[i];
      const newStatement = this.transformStatement(statement);
      statements.push(newStatement);
      changed ||= newStatement !== statement;
    }

    this.currentFunction = last;
    if (changed) {
      return createBoundStatement({
        kind: BoundKind.BoundMethodStatement,
        statements,
        parameters: node.parameters,
        modifiers: node.modifiers,
        name: node.name,
        type: node.type,
        scope: node.scope,
        tokens: node.tokens,
      })
    }
    return node;
  }

  transformProperty(node: BoundPropertyStatement): BoundPropertyStatement {
    return node;
  }

  transformClassStatement(node: BoundClassStatement): BoundClassStatement {
    const methods: BoundMethodStatement[] = [];
    const properties: BoundPropertyStatement[] = [];
    let isNew = false;
    for (const member of node.methods) {
      const other = this.transformMethod(member);
      isNew ||= other !== member;
      methods.push(other);
    }

    for (const member of node.properties) {
      const other = this.transformProperty(member);
      isNew ||= other !== member;
      properties.push(other);
    }


    if (isNew) {
      return createBoundStatement({
        kind: BoundKind.BoundClassStatement,
        methods,
        modifiers: node.modifiers,
        properties,
        name: node.name,
        type: node.type,
        scope: node.scope,
        tokens: node.tokens,
      })
    }
    return node;
  }

  transformArrayLiteralExpression(node: BoundArrayLiteralExpression): BoundExpression {
    const expressions = [];
    let isNew = false;
    for (const member of node.expressions) {
      const expression = this.transformExpression(member)
      isNew ||= expression !== member
      expressions.push(expression)
    }

    if (isNew) {
      return this.transformExpression({
        kind: BoundKind.BoundArrayLiteralExpression,
        type: node.type,
        expressions,
        tokens: node.tokens,
      })
    }
    return node;
  }

}