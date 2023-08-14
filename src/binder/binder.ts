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
import {ElseClause, FileSyntax, ParametersSyntax, SpecialSyntax} from "../source/syntax/special.syntax.js";
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
import {BuiltinFunctions} from "../php/buildin-functions.js";

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

    for (const [name, fn] of BuiltinFunctions.instances) {
      scope.tryDeclare(fn);
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

  private getTextSpan(syntax: StatementSyntax | ExpressionSyntax | SpecialSyntax): SyntaxToken[] {
    if (syntax === undefined) return [];
    switch (syntax.kind) {
      case SyntaxNodeKind.AssignmentExpressionSyntax:
        return [syntax.identifier, syntax.open, syntax.close, syntax.operator, ...this.getTextSpan(syntax.expression)].filter(Boolean);
      case SyntaxNodeKind.BinaryExpressionSyntax:
        return [...this.getTextSpan(syntax.left), syntax.operator, ...this.getTextSpan(syntax.right)];
      case SyntaxNodeKind.CommaExpressionSyntax:
        return syntax.expressions.map((el, idx, self) => [
          ...this.getTextSpan(el), self.length - 1 === idx ? undefined : syntax.commas[idx]
        ].filter(Boolean)).flat();
      case SyntaxNodeKind.EmptyExpressionSyntax:
        return []
      case SyntaxNodeKind.LiteralExpressionSyntax:
        return [syntax.token]
      case SyntaxNodeKind.NameExpressionSyntax:
        return [syntax.identifier];
      case SyntaxNodeKind.ParenExpressionSyntax:
        return [syntax.open, ...this.getTextSpan(syntax.expression), syntax.close];
      case SyntaxNodeKind.UnaryExpressionSyntax:
        return (syntax.post ? [syntax.operator, ...this.getTextSpan(syntax.operand)] : [...this.getTextSpan(syntax.operand), syntax.operator])
          .filter(Boolean);
      case SyntaxNodeKind.ArrayLiteralExpressionSyntax:
        return [syntax.open, ...this.getTextSpan(syntax.members), syntax.close];
      case SyntaxNodeKind.FileSyntax:
        return [];
      case SyntaxNodeKind.ParameterSyntax:
        return [syntax.name, syntax.type].filter(Boolean);
      case SyntaxNodeKind.TypeClause:
        return [syntax.identifier].filter(Boolean);
      case SyntaxNodeKind.ElseClauseSyntax:
        return [syntax.keyword];

      case SyntaxNodeKind.SemiColonSyntax:
        return [syntax.semicolon];
      case SyntaxNodeKind.BlockStatementSyntax:
        return [syntax.open];
      case SyntaxNodeKind.ContinueStatementSyntax:
      case SyntaxNodeKind.BreakStatementSyntax:
        return [syntax.keyword, syntax.depth, syntax.semicolon].filter(Boolean);
      case SyntaxNodeKind.ExpressionStatementSyntax:
        return [...this.getTextSpan(syntax.expression), syntax.semicolon];
      case SyntaxNodeKind.ForStatementSyntax:
        return [syntax.keyword, ...this.getTextSpan(syntax.init), ...this.getTextSpan(syntax.condition), ...this.getTextSpan(syntax.afterthought)];
      case SyntaxNodeKind.IfStatementSyntax:
        return [syntax.keyword, ...this.getTextSpan(syntax.condition)];
      case SyntaxNodeKind.FunctionStatementSyntax:
        return [syntax.keyword, syntax.identifier, ...syntax.parameters.map(el => this.getTextSpan(el)).flat(), syntax.open];
      case SyntaxNodeKind.ClassStatementSyntax:
        return [syntax.keyword, syntax.identifier, syntax.extendKeyword, syntax.extend, syntax.implementsKeyword, ...syntax.implements].filter(Boolean);
      case SyntaxNodeKind.PropertyStatementSyntax:
        return [...syntax.modifiers, syntax.type, syntax.identifier, ...this.getTextSpan(syntax.init)];
      case SyntaxNodeKind.ReturnStatementSyntax:
        return [syntax.keyword, ...this.getTextSpan(syntax.expression)];
      case SyntaxNodeKind.WhileStatementSyntax:
        return [syntax.keyword, ...this.getTextSpan(syntax.condition)];
      case SyntaxNodeKind.PrintStatementSyntax:
      case SyntaxNodeKind.EchoStatementSyntax:
        return [syntax.keyword, ...this.getTextSpan(syntax.expression)];
      case SyntaxNodeKind.CaseStatementSyntax:
        return [syntax.keyword, ...this.getTextSpan(syntax.expression), syntax.colon];
      case SyntaxNodeKind.SwitchStatementSyntax:
        return [syntax.keyword, ...this.getTextSpan(syntax.expression)];
    }
    throw new Error('not implemented '+SyntaxNodeKind[(syntax as any).kind]);
  }

  private bindExpressionStatement(syntax: ExpressionStatementSyntax): BoundExpressionStatement {
    const expression = this.bindExpression(syntax.expression);
    const tokens = this.getTextSpan(syntax);

    return createBoundStatement({kind: BoundKind.BoundExpressionStatement, expression, tokens});
  }

  private bindEchoStatementSyntax(syntax: EchoStatementSyntax) {
    const expression = this.bindExpression(syntax.expression);
    return createBoundStatement({
      kind: BoundKind.BoundEchoStatement,
      expression,
      tokens: this.getTextSpan(syntax),
    })
  }

  private bindBlockStatement(syntax: BlockStatementSyntax) {
    const statements = syntax.statements.map(el => this.bindStatement(el));
    const tokens = this.getTextSpan(syntax);
    return createBoundStatement({kind: BoundKind.BoundBlockStatement, statements, tokens})
  }

  private bindForStatementSyntax(syntax: ForStatementSyntax) {
    const init = this.bindExpression(syntax.init);
    const condition = this.bindExpression(syntax.condition);
    const afterthought = this.bindExpression(syntax.afterthought);
    const body = this.bindBodyStatement(syntax.body);
    const tokens = this.getTextSpan(syntax);

    return createBoundStatement({kind: BoundKind.BoundForStatement, init, condition, afterthought, body, tokens})
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
    const tokens = this.getTextSpan(syntax);

    return createBoundStatement({kind: BoundKind.BoundIfStatement, body, condition, elseBody, tokens})
  }

  private bindWhileStatementSyntax(syntax: WhileStatementSyntax) {
    const condition = this.bindExpression(syntax.condition);
    const body = this.bindBodyStatement(syntax.body);
    const tokens = this.getTextSpan(syntax);

    return createBoundStatement({kind: BoundKind.BoundWhileStatement, condition, body, tokens});
  }

  private bindSemiColonSyntax(syntax: SemiColonSyntax) {
    const tokens = this.getTextSpan(syntax);
    return createBoundStatement({kind: BoundKind.BoundSemiColonStatement, tokens})
  }

  private labelIds = new MapExt<string, number>(() => 0);

  private createLabel(name: string): BoundLabel {
    const id = this.labelIds.get(name);
    this.labelIds.set(name, id + 1);
    return createBoundSpecial({kind: BoundKind.BoundLabel, name: `${name}_${id}`, modifiers: 0});
  }

  private bindBodyStatement(syntax: StatementSyntax): BoundBodyStatement {
    const tokens = this.getTextSpan(syntax);
    // Because a body can contain a break or continue, already create the incomplete statement
    const placeholder = createPlaceholder<BoundBodyStatement>({
      kind: BoundKind.BoundBodyStatement,
      break: this.createLabel('break'),
      continue: this.createLabel('continue'),
      statement: undefined,
      tokens,
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
    const tokens = this.getTextSpan(syntax);
    return createBoundExpression({kind: BoundKind.BoundCommaExpression, expressions, type: last.type, tokens});
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

    const tokens = this.getTextSpan(syntax);
    const isArray = Boolean(syntax.open && syntax.close);
    return createBoundExpression({kind: BoundKind.BoundAssignmentExpression, expression, variable, type, tokens, isArray})
  }

  bindBinaryExpression(syntax: BinaryExpressionSyntax) {
    const left = this.bindExpression(syntax.left);
    const right = this.bindExpression(syntax.right);
    const tokens = this.getTextSpan(syntax);

    if (left.type === TypeSymbol.error || right.type === TypeSymbol.error) {
      return createBoundExpression({kind: BoundKind.BoundErrorExpression, type: TypeSymbol.error, tokens});
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
      return createBoundExpression({kind: BoundKind.BoundErrorExpression, type: TypeSymbol.error, tokens});
    }

    return createBoundExpression({
      kind: BoundKind.BoundBinaryExpression,
      left,
      operator,
      right,
      type: operator.resultType,
      modifiers: 0,
      tokens,
    });
  }

  bindNameExpression(syntax: NameExpressionSyntax) {
    const tokens = this.getTextSpan(syntax);
    const name = syntax.identifier.text;
    if (name === null) {
      // Invalid node
      return createBoundExpression({kind: BoundKind.BoundLiteralExpression, type: TypeSymbol.error, value: 0, tokens})
    }

    let [has, variable] = this.scope.tryLookup(name);
    if (!has) {
      // Sadly, in the way php works, this has to be a placeholder. We cant throw a compile error here due to
      // the way its dynamically typed
      variable = new VariableSymbol(name, false, TypeSymbol.any);
    }

    if (syntax.identifier.kind === SyntaxKind.VariableToken) {
      return createBoundExpression({kind: BoundKind.BoundVariableExpression, type: variable.type, variable, tokens});
    }

    return createBoundExpression({
      kind: BoundKind.BoundNameExpression,
      type: variable.type,
      variable,
      modifiers: 0,
      tokens
    });
  }

  bindLiteralExpression(syntax: LiteralExpressionSyntax) {
    const value = syntax.value ?? 0;
    const tokens = this.getTextSpan(syntax);
    return createBoundExpression({
      kind: BoundKind.BoundLiteralExpression,
      value,
      type: syntax.type,
      tokens,
    })
  }

  bindParenExpression(syntax: ParenExpressionSyntax) {
    return this.bindExpression(syntax.expression);
  }

  bindUnaryExpression(syntax: UnaryExpressionSyntax) {
    let operand = this.bindExpression(syntax.operand);
    const tokens = this.getTextSpan(syntax);
    if (operand.type === TypeSymbol.error) {
      return createBoundExpression({kind: BoundKind.BoundErrorExpression, type: TypeSymbol.error, tokens});
    }

    const operator = BoundUnaryOperator.bind(syntax.operator.kind, operand.type, syntax.post)
    if (!operator) {
      this.diagnostics.reportUndefinedUnaryOperator(syntax.operator.span, syntax.operator.text);
      return operand;
    }

    if (operator.kind === BoundUnaryOperatorKind.New) {
      // Support syntax "new Foo" without parens
      if (operand.kind === BoundKind.BoundNameExpression) {
        const right = createBoundExpression({kind: BoundKind.BoundEmptyExpression, type: TypeSymbol.void, tokens})
        operand = createBoundExpression({
          kind: BoundKind.BoundBinaryExpression,
          left: operand,
          right: right,
          type: TypeSymbol.any,
          modifiers: 0,
          operator: BoundBinaryOperator.memberCall,
          tokens
        })
      }

    }

    return createBoundExpression({
      kind: BoundKind.BoundUnaryExpression,
      type: operator.resultType,
      operand,
      operator,
      tokens
    });
  }


  private bindElseClause(elseClause?: ElseClause) {
    if (elseClause) {
      return this.bindStatement(elseClause.body);
    }
    return elseClause;
  }

  private bindContinueStatement(syntax: ContinueStatementSyntax): BoundContinueStatement | BoundSemiColonStatement {
    const tokens = this.getTextSpan(syntax);
    if (this.currentBreakContinueTarget.length === 0) {
      this.diagnostics.reportCannotContinue(syntax.keyword.span);
      return createBoundStatement({kind: BoundKind.BoundSemiColonStatement, tokens});
    }

    const depth = syntax.depth?.value ?? 1;
    if (depth > this.currentBreakContinueTarget.length || depth < 0) {
      this.diagnostics.reportCannotContinueOnThisDepth(syntax.keyword.span);
      return createBoundStatement({kind: BoundKind.BoundSemiColonStatement, tokens});
    }

    const {continue: label} = this.currentBreakContinueTarget[this.currentBreakContinueTarget.length - depth];

    return createBoundStatement({kind: BoundKind.BoundContinueStatement, label, depth, tokens});
  }

  private bindBreakStatement(syntax: BreakStatementSyntax): BoundContinueStatement | BoundSemiColonStatement {
    const tokens = this.getTextSpan(syntax);
    if (this.currentBreakContinueTarget.length === 0) {
      this.diagnostics.reportCannotBreak(syntax.keyword.span);
      return createBoundStatement({kind: BoundKind.BoundSemiColonStatement, tokens});
    }

    const depth = parseInt(syntax.depth?.text) ?? 1;
    if (depth > this.currentBreakContinueTarget.length || depth < 0) {
      this.diagnostics.reportCannotBreakOnThisDepth(syntax.keyword.span);
      return createBoundStatement({kind: BoundKind.BoundSemiColonStatement, tokens});
    }

    const {break: label} = this.currentBreakContinueTarget[this.currentBreakContinueTarget.length - depth];
    return createBoundStatement({kind: BoundKind.BoundBreakStatement, label, depth, tokens});
  }

  private bindEmptyExpression(syntax: EmptyExpressionSyntax) {
    const tokens = this.getTextSpan(syntax);
    return createBoundExpression({
      kind: BoundKind.BoundEmptyExpression,
      type: TypeSymbol.void,
      tokens,
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

    this.unwrapScope();
    const tokens = this.getTextSpan(syntax);
    return createBoundStatement({
      kind: BoundKind.BoundMethodStatement,
      statements,
      modifiers,
      parameters: parameters,
      name: syntax.identifier.text,
      type: TypeSymbol.func,
      scope,
      tokens,
    })
  }

  private bindPropertiesStatement(syntax: PropertyStatementSyntax): BoundPropertyStatement {
    const modifiers = this.bindModifiers(Modifiers.AllowedOnProperty, syntax.modifiers, 'property');
    const tokens = this.getTextSpan(syntax);
    return createBoundStatement({
      kind: BoundKind.BoundPropertyStatement,
      modifiers,
      name: syntax.identifier.text,
      init: syntax.init ? this.bindExpression(syntax.init) : undefined,
      tokens,
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
    const tokens = this.getTextSpan(syntax);

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
      name: syntax.identifier.text,
      modifiers,
      methods,
      properties,
      type: TypeSymbol.class,
      scope,
      tokens,
    })
  }

  private bindReturnStatementSyntax(syntax: ReturnStatementSyntax) {
    const tokens = this.getTextSpan(syntax)
    return createBoundStatement({
      kind: BoundKind.BoundReturnStatement,
      expression: this.bindExpression(syntax.expression) as BoundExpression,
      tokens,
    });
  }

  private bindCaseStatementSyntax(syntax: CaseStatementSyntax): BoundCaseStatement {
    const expression = this.bindExpression(syntax.expression);
    const statements = syntax.statements.map(el => this.bindStatement(el));
    const tokens = this.getTextSpan(syntax);
    return createBoundStatement({
      kind: BoundKind.BoundCaseStatement,
      expression,
      statements,
      tokens
    });
  }

  private bindSwitchStatementSyntax(syntax: SwitchStatementSyntax) {
    const expression = this.bindExpression(syntax.expression);
    const tokens = this.getTextSpan(syntax)

    const placeholder = createPlaceholder<BoundSwitchStatement>({
      kind: BoundKind.BoundSwitchStatement,
      expression,
      continue: undefined,
      break: undefined,
      cases: undefined,
      tokens,
    });
    placeholder.continue = placeholder.break = this.createLabel('break');
    this.currentBreakContinueTarget.push(placeholder)

    placeholder.cases = syntax.cases.map(el => this.bindCaseStatementSyntax(el))

    this.currentBreakContinueTarget.pop();
    return createBoundStatement(placeholder);
  }

  private expressionToArrayOf(expression: BoundExpression) {
    switch (expression.kind) {
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
    const tokens = this.getTextSpan(syntax);

    return createBoundExpression({
      kind: BoundKind.BoundArrayLiteralExpression,
      type: TypeSymbol.any, // ToDo; parse phpdocs?
      expressions,
      tokens,
    })
  }
}