import {
  BoundBodyStatement,
  BoundCaseStatement,
  BoundContinueStatement,
  BoundExpressionStatement,
  BoundMethodStatement,
  BoundPropertyStatement,
  BoundSemiColonStatement,
  BoundStatement,
  BoundSwitchStatement,
  BoundVariableStatement
} from "./bound-statement.js";
import {BoundScope} from "./bound-scope.js";
import {Diagnostics} from "../common/diagnostics.js";
import {TypeSymbol, VariableSymbol} from "../symbols/symbols.js";
import {
  BlockStatementSyntax,
  BreakStatementSyntax,
  CaseStatementSyntax,
  ClassStatementSyntax,
  ContinueStatementSyntax,
  EchoStatementSyntax,
  ExpressionStatementSyntax,
  ForStatementSyntax,
  FunctionStatementSyntax,
  IfStatementSyntax,
  PropertyStatementSyntax,
  ReturnStatementSyntax,
  SemiColonSyntax,
  StatementSyntax,
  SwitchStatementSyntax,
  VariableStatementSyntax,
  WhileStatementSyntax
} from "../source/syntax/statement.syntax.js";
import {SyntaxNodeKind} from "../source/syntax/syntax.node.js";
import {
  BoundKind,
  BoundNode,
  createBoundExpression,
  createBoundSpecial,
  createBoundStatement,
  createPlaceholder
} from "./bound.node.js";
import {ElseClause, FileSyntax, ParametersSyntax} from "../source/syntax/special.syntax.js";
import {BoundFile, BoundLabel, BoundParameter} from "./bound-special.js";
import {MapExt} from "map-ext";
import {
  ArrayLiteralExpressionSyntax,
  AssignmentExpressionSyntax,
  BinaryExpressionSyntax,
  CommaExpressionSyntax,
  EmptyExpressionSyntax,
  ExpressionSyntax,
  LiteralExpressionSyntax,
  NameExpressionSyntax,
  ParenExpressionSyntax,
  UnaryExpressionSyntax
} from "../source/syntax/expression.syntax.js";
import {BoundExpression} from "./bound-expression.js";
import {BoundBinaryOperator, BoundUnaryOperator, BoundUnaryOperatorKind} from "./bound-operator.js";
import {TextSpan} from "../common/text-span.js";
import {SyntaxKind} from "../source/syntax/syntax.kind.js";
import {SyntaxToken} from "../source/lexer.js";
import {ModifierMapping, Modifiers} from "../source/syntax/syntax.facts.js";

export class Binder {
  private currentBreakContinueTarget: Array<{ break: BoundLabel, continue: BoundLabel }> = [];

  public scope: BoundScope;
  public last: BoundNode;

  constructor(public readonly diagnostics: Diagnostics, scope?: BoundScope) {
    this.scope = scope ?? this.createParentScope()
  }

  private createParentScope(): BoundScope {
    const scope = new BoundScope();
    for (const type of TypeSymbol.beginTypes) {
      scope.tryDeclareType(type);
    }

    // Add buildin methods to parent scope
    // for (const [, method] of BuiltinFunctions.instances) {
    //   scope.tryDeclare(method);
    // }

    return scope;
  }


  bindStatement(syntax: StatementSyntax) {
    if (syntax) switch (syntax.kind) {
      case SyntaxNodeKind.ClassStatementSyntax:
        return this.bindClassStatement(syntax);
      case SyntaxNodeKind.ContinueStatementSyntax:
        return this.bindContinueStatement(syntax);
      case SyntaxNodeKind.BreakStatementSyntax:
        return this.bindBreakStatement(syntax);
      case SyntaxNodeKind.ExpressionStatementSyntax:
        return this.bindExpressionStatement(syntax);
      case SyntaxNodeKind.BlockStatementSyntax:
        return this.bindBlockStatement(syntax);
      case SyntaxNodeKind.ForStatementSyntax:
        return this.bindForStatementSyntax(syntax);
      case SyntaxNodeKind.IfStatementSyntax:
        return this.bindIfStatementSyntax(syntax);
      case SyntaxNodeKind.VariableStatementSyntax:
        return this.bindVariableStatementSyntax(syntax);
      case SyntaxNodeKind.WhileStatementSyntax:
        return this.bindWhileStatementSyntax(syntax);
      case SyntaxNodeKind.SemiColonSyntax:
        return this.bindSemiColonSyntax(syntax);
      case SyntaxNodeKind.EchoStatementSyntax:
        return this.bindEchoStatementSyntax(syntax);
      case SyntaxNodeKind.ReturnStatementSyntax:
        return this.bindReturnStatementSyntax(syntax);
      case SyntaxNodeKind.SwitchStatementSyntax:
        return this.bindSwitchStatementSyntax(syntax);
    }
    throw new Error(`Unexpected syntax ${SyntaxNodeKind[syntax?.kind]}`)
  }

  private bindExpressionStatement(syntax: ExpressionStatementSyntax): BoundExpressionStatement {
    const expression = this.bindExpression(syntax.expression);
    return createBoundStatement({kind: BoundKind.BoundExpressionStatement, expression})
  }

  private bindEchoStatementSyntax(syntax: EchoStatementSyntax) {
    const expression = this.bindExpression(syntax.expression);
    return createBoundStatement({
      kind: BoundKind.BoundEchoStatement,
      expression,
    })
  }

  private bindBlockStatement(syntax: BlockStatementSyntax) {
    const statements = syntax.statements.map(el => this.bindStatement(el));
    return createBoundStatement({kind: BoundKind.BoundBlockStatement, statements})
  }

  private bindForStatementSyntax(syntax: ForStatementSyntax) {
    const init = this.bindExpression(syntax.init);
    const condition = this.bindExpression(syntax.condition);
    const afterthought = this.bindExpression(syntax.afterthought);
    const body = this.bindBodyStatement(syntax.body);

    return createBoundStatement({kind: BoundKind.BoundForStatement, init, condition, afterthought, body})
  }


  private bindOptionalType(type?: SyntaxToken) {
    if (!type) {
      return TypeSymbol.any;
    }

    // If type is defined specifically, but it cant be found, return an error
    return this.scope.tryLookupType(type.text) ?? TypeSymbol.error;
  }

  private bindParameter(syntax: ParametersSyntax) {
    const type = this.bindOptionalType(syntax.type);
    if (type === TypeSymbol.error) {
      this.diagnostics.reportTypeDoesntExists(syntax.type.span, syntax.type.text);
    }
    const variable = new VariableSymbol(syntax.name.text, false, type);
    this.scope.tryDeclare(variable)
    return createBoundSpecial<BoundParameter>({kind: BoundKind.BoundParameter, variable});
  }

  private bindIfStatementSyntax(syntax: IfStatementSyntax) {
    const condition = this.bindExpression(syntax.condition);
    const body = this.bindStatement(syntax.body)
    const elseBody = this.bindElseClause(syntax.elseClause)

    return createBoundStatement({kind: BoundKind.BoundIfStatement, body, condition, elseBody})
  }

  private bindVariableStatementSyntax(syntax: VariableStatementSyntax): BoundVariableStatement {
    const name = syntax.identifier.text;
    const isReadonly = syntax.keyword.kind === SyntaxKind.ConstKeyword;
    const init = this.bindExpression(syntax.init);

    const variable = new VariableSymbol(name, isReadonly, init.type)
    if (!this.scope.tryDeclare(variable)) {
      this.diagnostics.reportCannotRedeclare(syntax.identifier.span, syntax.identifier.text);
    }

    return createBoundStatement({kind: BoundKind.BoundVariableStatement, variable, init});
  }

  private bindWhileStatementSyntax(syntax: WhileStatementSyntax) {
    const condition = this.bindExpression(syntax.condition);
    const body = this.bindBodyStatement(syntax.body);

    return createBoundStatement({kind: BoundKind.BoundWhileStatement, condition, body});
  }

  private bindSemiColonSyntax(syntax: SemiColonSyntax) {
    return createBoundStatement({kind: BoundKind.BoundSemiColonStatement})
  }

  private labelIds = new MapExt<string, number>(() => 0);

  private createLabel(name: string): BoundLabel {
    const id = this.labelIds.get(name);
    this.labelIds.set(name, id + 1);
    return createBoundSpecial({kind: BoundKind.BoundLabel, name: `${name}_${id}`, modifiers: 0});
  }

  private bindBodyStatement(syntax: StatementSyntax): BoundBodyStatement {
    // Because a body can contain a break or continue, already create the incomplete statement
    const placeholder = createPlaceholder<BoundBodyStatement>({
      kind: BoundKind.BoundBodyStatement,
      break: this.createLabel('break'),
      continue: this.createLabel('continue'),
      statement: undefined,
    })

    this.currentBreakContinueTarget.push(placeholder);
    placeholder.statement = this.bindStatement(syntax);
    this.currentBreakContinueTarget.pop()

    return createBoundStatement(placeholder);
  }

  // Expressions
  private bindExpression(expression: ExpressionSyntax): BoundExpression {
    if (expression) switch (expression.kind) {
      case SyntaxNodeKind.EmptyExpressionSyntax:
        return this.bindEmptyExpression(expression)
      case SyntaxNodeKind.CommaExpressionSyntax:
        return this.bindCommaExpression(expression);
      case SyntaxNodeKind.AssignmentExpressionSyntax:
        return this.bindAssignmentExpression(expression);
      case SyntaxNodeKind.BinaryExpressionSyntax:
        return this.bindBinaryExpression(expression);
      case SyntaxNodeKind.NameExpressionSyntax:
        return this.bindNameExpression(expression);
      case SyntaxNodeKind.LiteralExpressionSyntax:
        return this.bindLiteralExpression(expression);
      case SyntaxNodeKind.ParenExpressionSyntax:
        return this.bindParenExpression(expression);
      case SyntaxNodeKind.UnaryExpressionSyntax:
        return this.bindUnaryExpression(expression);
      case SyntaxNodeKind.ArrayLiteralExpressionSyntax:
        return this.bindArrayLiteralExpression(expression);
    }
    throw new Error(`Unexpected expression kind ${SyntaxNodeKind[expression?.kind]}`)
  }

  bindCommaExpression(syntax: CommaExpressionSyntax) {
    const expressions = syntax.expressions.map(e => this.bindExpression(e));
    const last = expressions[expressions.length - 1];
    return createBoundExpression({kind: BoundKind.BoundCommaExpression, expressions, type: last.type});
  }

  bindAssignmentExpression(syntax: AssignmentExpressionSyntax): BoundExpression {
    const name = syntax.identifier.text;
    const expression = this.bindExpression(syntax.expression);
    const type = expression.type;

    // upsert / override variable
    let [has, variable] = this.scope.tryLookup(name);
    if (!has) {
      // Variable is created here in the current scope
      variable = new VariableSymbol(name, false, TypeSymbol.any);
      this.scope.tryDeclare(variable);
    }


    if (variable.isReadonly) {
      this.diagnostics.reportCannotAssign(syntax.operator.span, name)
      return expression;
    }

    if (expression.type !== variable.type && variable.type !== TypeSymbol.any && expression.type !== TypeSymbol.any) {
      this.diagnostics.reportCannotConvert(syntax.expression.span, expression.type, variable.type)
      return expression;
    }

    return createBoundExpression({kind: BoundKind.BoundAssignmentExpression, expression, variable, type})
  }

  bindBinaryExpression(syntax: BinaryExpressionSyntax) {
    const left = this.bindExpression(syntax.left);
    const right = this.bindExpression(syntax.right);

    if (left.type === TypeSymbol.error || right.type === TypeSymbol.error) {
      return createBoundExpression({kind: BoundKind.BoundErrorExpression, type: TypeSymbol.error});
    }

    const operator = BoundBinaryOperator.bind(syntax.operator.kind, left, right);
    if (!operator) {

      // Function calls are different, as its left(right) and not left + right
      let span: TextSpan = syntax.operator.span;
      if (syntax.operator.kind === SyntaxKind.ParenOpenToken) {
        if (right.kind === BoundKind.BoundEmptyExpression) {
          span = new TextSpan(span.start, span.start + 2)
        } else {
          const rightSpan = syntax.right.span
          span = new TextSpan(span.start, rightSpan.end)
        }
      }

      this.diagnostics.reportUndefinedBinaryOperator(span, syntax.operator.text, left.type, right.type);
      return createBoundExpression({kind: BoundKind.BoundErrorExpression, type: TypeSymbol.error});
    }

    return createBoundExpression({
      kind: BoundKind.BoundBinaryExpression,
      left,
      operator,
      right,
      type: operator.resultType,
      modifiers: 0,
    });
  }

  bindNameExpression(syntax: NameExpressionSyntax) {
    const name = syntax.id.text;
    if (name === null) {
      // Invalid node
      return createBoundExpression({kind: BoundKind.BoundLiteralExpression, type: TypeSymbol.error, value: 0})
    }

    let [has, variable] = this.scope.tryLookup(name);
    if (!has) {
      // Sadly, in the way php works, this has to be a placeholder. We cant throw a compile error here due to
      // the way its dynamically typed
      variable = new VariableSymbol(name, false, TypeSymbol.any);
    }

    if (syntax.id.kind === SyntaxKind.VariableToken) {
      return createBoundExpression({kind: BoundKind.BoundVariableExpression, type: variable.type, variable});
    }

    return createBoundExpression({kind: BoundKind.BoundNameExpression, type: variable.type, variable, modifiers: 0});
  }

  bindLiteralExpression(syntax: LiteralExpressionSyntax) {
    const value = syntax.value ?? 0;
    return createBoundExpression({
      kind: BoundKind.BoundLiteralExpression,
      value,
      type: syntax.type,
    })
  }

  bindParenExpression(syntax: ParenExpressionSyntax) {
    return this.bindExpression(syntax.expression);
  }

  bindUnaryExpression(syntax: UnaryExpressionSyntax) {
    let operand = this.bindExpression(syntax.operand);
    if (operand.type === TypeSymbol.error) {
      return createBoundExpression({kind: BoundKind.BoundErrorExpression, type: TypeSymbol.error});
    }

    const operator = BoundUnaryOperator.bind(syntax.operator.kind, operand.type, syntax.post)
    if (!operator) {
      this.diagnostics.reportUndefinedUnaryOperator(syntax.operator.span, syntax.operator.text);
      return operand;
    }

    if (operator.kind === BoundUnaryOperatorKind.New) {
      // Support syntax "new Foo" without parens
      if (operand.kind === BoundKind.BoundNameExpression) {
        const right = createBoundExpression({kind: BoundKind.BoundEmptyExpression, type: TypeSymbol.void})
        operand = createBoundExpression({
          kind: BoundKind.BoundBinaryExpression,
          left: operand,
          right: right,
          type: TypeSymbol.any,
          modifiers: 0,
          operator: BoundBinaryOperator.memberCall
        })
      }

    }

    return createBoundExpression({kind: BoundKind.BoundUnaryExpression, type: operator.resultType, operand, operator});
  }


  private bindElseClause(elseClause?: ElseClause) {
    if (elseClause) {
      return this.bindStatement(elseClause.body);
    }
    return elseClause;
  }

  private bindContinueStatement(syntax: ContinueStatementSyntax): BoundContinueStatement | BoundSemiColonStatement {
    if (this.currentBreakContinueTarget.length === 0) {
      this.diagnostics.reportCannotContinue(syntax.keyword.span);
      return createBoundStatement({kind: BoundKind.BoundSemiColonStatement});
    }

    const depth = syntax.depth?.value ?? 1;
    if (depth > this.currentBreakContinueTarget.length || depth < 0) {
      this.diagnostics.reportCannotContinueOnThisDepth(syntax.keyword.span);
      return createBoundStatement({kind: BoundKind.BoundSemiColonStatement});
    }

    const {continue: label} = this.currentBreakContinueTarget[this.currentBreakContinueTarget.length - depth];

    return createBoundStatement({kind: BoundKind.BoundContinueStatement, label, depth});
  }

  private bindBreakStatement(syntax: BreakStatementSyntax): BoundContinueStatement | BoundSemiColonStatement {
    if (this.currentBreakContinueTarget.length === 0) {
      this.diagnostics.reportCannotBreak(syntax.keyword.span);
      return createBoundStatement({kind: BoundKind.BoundSemiColonStatement});
    }

    const depth = parseInt(syntax.depth?.text) ?? 1;
    if (depth > this.currentBreakContinueTarget.length || depth < 0) {
      this.diagnostics.reportCannotBreakOnThisDepth(syntax.keyword.span);
      return createBoundStatement({kind: BoundKind.BoundSemiColonStatement});
    }

    const {break: label} = this.currentBreakContinueTarget[this.currentBreakContinueTarget.length - depth];
    return createBoundStatement({kind: BoundKind.BoundBreakStatement, label, depth});
  }

  private bindEmptyExpression(expression: EmptyExpressionSyntax) {
    return createBoundExpression({
      kind: BoundKind.BoundEmptyExpression,
      type: TypeSymbol.void,
    })
  }


  bindFile(file: FileSyntax): BoundFile & BoundNode {
    const statements: BoundStatement[] = []
    for (const statement of file.body) {
      statements.push(this.bindStatement(statement));
    }

    const node = createBoundStatement({
      kind: BoundKind.BoundFile,
      statements,
      filename: file.filename,
      scope: this.scope
    });

    return node as BoundFile & BoundNode;
  }


  private bindModifiers(allowed: Modifiers, modifiers: SyntaxToken[], on: string) {
    let mods = 0;
    for (const modifier of modifiers) {
      const flag = ModifierMapping[String(modifier.kind)];
      if ((allowed & flag) !== flag) {
        this.diagnostics.reportModifierNotAllowed(modifier.span, on)
      } else {
        mods |= flag;
      }
    }
    return mods;
  }

  private bindFunctionStatement(syntax: FunctionStatementSyntax): BoundMethodStatement {
    const scope = this.wrapScope()

    const statements = syntax.statements.map(el => this.bindStatement(el));
    const modifiers = this.bindModifiers(Modifiers.AllowedOnMethod, syntax.modifiers, 'method');
    const parameters = syntax.parameters.map(el => this.bindParameter(el));

    this.unwrapScope()
    return createBoundStatement({
      kind: BoundKind.BoundMethodStatement,
      statements,
      modifiers,
      parameters: parameters,
      name: syntax.identifier.text,
      type: TypeSymbol.func,
      scope,
    })
  }

  private bindPropertiesStatement(syntax: PropertyStatementSyntax): BoundPropertyStatement {
    const modifiers = this.bindModifiers(Modifiers.AllowedOnProperty, syntax.modifiers, 'property');

    return createBoundStatement({
      kind: BoundKind.BoundPropertyStatement,
      modifiers,
      name: syntax.identifier.text,
      init: syntax.init ? this.bindExpression(syntax.init) : undefined,
    })
  }

  private wrapScope() {
    return this.scope = this.scope.createChild();
  }

  private unwrapScope() {
    this.scope = this.scope.parent;
  }

  private bindClassStatement(syntax: ClassStatementSyntax) {
    const scope = this.wrapScope();

    const modifiers = this.bindModifiers(Modifiers.AllowedInClass, syntax.modifiers, 'class');

    const methods: BoundMethodStatement[] = [];
    for (const member of syntax.methods) {
      methods.push(this.bindFunctionStatement(member));
    }

    const properties: BoundPropertyStatement[] = [];
    for (const member of syntax.properties) {
      properties.push(this.bindPropertiesStatement(member))
    }

    this.unwrapScope();
    return createBoundStatement({
      kind: BoundKind.BoundClassStatement,
      name: syntax.name.text,
      modifiers,
      methods,
      properties,
      type: TypeSymbol.class,
      scope,
    })
  }

  private bindReturnStatementSyntax(syntax: ReturnStatementSyntax) {
    return createBoundStatement({
      kind: BoundKind.BoundReturnStatement,
      expression: this.bindExpression(syntax.expression) as BoundExpression,
    });
  }

  private bindCaseStatementSyntax(syntax: CaseStatementSyntax): BoundCaseStatement {
    const expression = this.bindExpression(syntax.expression);
    const statements = syntax.statements.map(el => this.bindStatement(el));

    return createBoundStatement({
      kind: BoundKind.BoundCaseStatement,
      expression,
      statements,
    });
  }

  private bindSwitchStatementSyntax(syntax: SwitchStatementSyntax) {
    const expression = this.bindExpression(syntax.expression);

    const placeholder = createPlaceholder<BoundSwitchStatement>({
      kind: BoundKind.BoundSwitchStatement,
      expression,
      continue: undefined,
      break: undefined,
      cases: undefined,
    });
    placeholder.continue = placeholder.break = this.createLabel('break');
    this.currentBreakContinueTarget.push(placeholder)

    placeholder.cases = syntax.cases.map(el => this.bindCaseStatementSyntax(el))

    this.currentBreakContinueTarget.pop();
    return createBoundStatement(placeholder);
  }

  private expressionToArrayOf(expression: BoundExpression) {
    switch(expression.kind) {
      case BoundKind.BoundCommaExpression:
        return expression.expressions;
      case BoundKind.BoundEmptyExpression:
        return []
      default:
        return [expression];
    }
  }

  private bindArrayLiteralExpression(syntax: ArrayLiteralExpressionSyntax) {
    const expressions = this.expressionToArrayOf(this.bindExpression(syntax.members));

    return createBoundExpression({
      kind: BoundKind.BoundArrayLiteralExpression,
      type: TypeSymbol.any, // ToDo; parse phpdocs?
      expressions,
    })
  }
}