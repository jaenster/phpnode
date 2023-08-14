import {Source} from "./source.js";
import {SyntaxToken} from "./lexer.js";
import {Diagnostics} from "../common/diagnostics.js";
import {
  BlockStatementSyntax,
  CaseStatementSyntax,
  ExpressionStatementSyntax,
  FunctionStatementSyntax,
  PropertyStatementSyntax,
  StatementSyntax,
} from "./syntax/statement.syntax.js";
import {
  createExpressionNode,
  createSpecialNode,
  createStatementNode,
  SyntaxNode,
  SyntaxNodeKind
} from "./syntax/syntax.node.js";
import {ElseClause, FileSyntax, ParametersSyntax, TypeClause} from "./syntax/special.syntax.js";
import {AssignmentExpressionSyntax, ExpressionSyntax} from "./syntax/expression.syntax.js";
import {
  canBePostFixOperator,
  getBinaryOperatorPrecedence,
  getUnaryOperatorPrecedence,
  ModifierMapping,
  Modifiers,
  supportsOnlyNameExpression
} from "./syntax/syntax.facts.js";
import {TypeSymbol} from "../symbols/symbols.js";
import {SyntaxKind} from "./syntax/syntax.kind.js";
import {PickByType} from "../types.js";


export class Parser {
  private position: number = 0;
  private lostModifiers: SyntaxToken[];

  constructor(
    public readonly source: Source,
    public readonly tokens: SyntaxToken[],
    private diagnostics: Diagnostics,
  ) {

  }

  // Statements
  private parseStatement(): StatementSyntax {
    this.lostModifiers = this.parseModifiers(Modifiers.AllowedInClass);

    switch (this.current().kind) {
      case SyntaxKind.InsteadofKeyword:
      // ToDo; Can support it some day, but its barely used and a big hack
      case SyntaxKind.GotoKeyword:
      // ToDo; goto can be supported with weird labeled blocks in nodejs and a while true,
      // Todo; write support fot it in the binder, some day.
      case SyntaxKind.EvalKeyword:
      case SyntaxKind.DeclareKeyword:
      case SyntaxKind.HaltCompilerKeyword:
        throw new Error('Unsupported keyword');

      case SyntaxKind.ClassKeyword:
        return this.parseClassStatement();
      case SyntaxKind.ExitKeyword:
      case SyntaxKind.DieKeyword:
        break;
      case SyntaxKind.DoKeyword:
      case SyntaxKind.ForEachKeyword:
      case SyntaxKind.FunctionKeyword:
      case SyntaxKind.GlobalKeyword:
        break;
      case SyntaxKind.IncludeKeyword:
      case SyntaxKind.IncludeOnceKeyword:
      case SyntaxKind.RequireKeyword:
      case SyntaxKind.RequireOnceKeyword:
        throw new Error('Current no support for multiple files')
      case SyntaxKind.InstanceofKeyword:
        break;
      case SyntaxKind.InterfaceKeyword:
        break;
      case SyntaxKind.IssetKeyword:
        break;
      case SyntaxKind.MatchKeyword:
        break;
      case SyntaxKind.NamespaceKeyword:
        break;
      case SyntaxKind.PrintKeyword:
        break;
      case SyntaxKind.StaticKeyword:
        break;
      case SyntaxKind.ThrowKeyword:
        break;
      case SyntaxKind.TraitKeyword:
        break;
      case SyntaxKind.TryKeyword:
        break;
      case SyntaxKind.UnsetKeyword:
        break;
      case SyntaxKind.UseKeyword:
        return this.parseUseStatement();
      case SyntaxKind.VarKeyword:
        break;
      case SyntaxKind.YieldKeyword:
        break;


      case SyntaxKind.PhpOpenToken:
        // For now just skip, later convert to a big echo statement
        this.match(SyntaxKind.PhpOpenToken)
        return this.parseStatement();

      case SyntaxKind.BraceOpenToken:
        return this.parseBlockStatement()
      case SyntaxKind.IfKeyword:
        return this.parseIfStatement()
      case SyntaxKind.WhileKeyword:
        return this.parseWhileStatement();
      case SyntaxKind.ForKeyword:
        return this.parseForStatement();
      case SyntaxKind.SemiColonToken:
        return this.parseSemiColonStatement()
      case SyntaxKind.BreakKeyword:
        return this.parseBreakStatement()
      case SyntaxKind.ContinueKeyword:
        return this.parseContinueStatement()
      case SyntaxKind.ReturnKeyword:
        return this.parseReturnStatement();
      case SyntaxKind.EchoKeyword:
        return this.parseEchoStatement();
      case SyntaxKind.SwitchKeyword:
        return this.parseSwitchStatement()
    }
    return this.parseExpressionStatement()
  }

  private parseBlockStatement(): BlockStatementSyntax {
    const statements = [] as StatementSyntax[];

    const open = this.match(SyntaxKind.BraceOpenToken);
    while (this.current().kind !== SyntaxKind.EOF && this.current().kind !== SyntaxKind.BraceCloseToken) {

      const start = this.current();
      const statement = this.parseStatement();
      statements.push(statement);

      // Avoid infinite loops on bugged statements
      if (this.current() === start) {
        this.nextToken();
      }

    }
    const close = this.match(SyntaxKind.BraceCloseToken)

    return createStatementNode<BlockStatementSyntax>({
      kind: SyntaxNodeKind.BlockStatementSyntax,
      open,
      statements,
      close,
    })
  }

  private parseSemiColonStatement() {
    const semicolon = this.match(SyntaxKind.SemiColonToken);
    return createStatementNode({kind: SyntaxNodeKind.SemiColonSyntax, semicolon})
  }

  private parseBreakStatement() {
    const keyword = this.match(SyntaxKind.BreakKeyword);
    const [hasDepth, depth] = this.optional(SyntaxKind.NumberToken);
    const semicolon = this.match(SyntaxKind.SemiColonToken);

    return createStatementNode({kind: SyntaxNodeKind.BreakStatementSyntax, keyword, depth, semicolon})
  }

  private parseContinueStatement() {
    const keyword = this.match(SyntaxKind.ContinueKeyword);
    const [hasDepth, depth] = this.optional(SyntaxKind.NumberToken);
    const semicolon = this.match(SyntaxKind.SemiColonToken);

    return createStatementNode({kind: SyntaxNodeKind.ContinueStatementSyntax, keyword, depth, semicolon})
  }

  private parseExpressionStatement() {
    const expression = this.parseExpression();
    const semicolon = this.match(SyntaxKind.SemiColonToken);
    return createStatementNode<ExpressionStatementSyntax>({
      kind: SyntaxNodeKind.ExpressionStatementSyntax,
      expression,
      semicolon
    });
  }

  private parseIfStatement() {
    const keyword = this.match(SyntaxKind.IfKeyword);
    const condition = this.parseExpression();
    const body = this.parseStatement();
    const elseClause = this.parseElseClause();
    return createStatementNode({kind: SyntaxNodeKind.IfStatementSyntax, keyword, condition, body, elseClause});
  }

  private parseElseClause() {
    if (this.current().kind !== SyntaxKind.ElseKeyword) {
      return;
    }

    const keyword = this.nextToken();
    const body = this.parseStatement();
    return createSpecialNode<ElseClause>({kind: SyntaxNodeKind.ElseClauseSyntax, keyword, body});
  }

  private parseWhileStatement() {
    const keyword = this.match(SyntaxKind.WhileKeyword);
    const condition = this.parseExpression();
    const body = this.parseStatement();

    return createStatementNode({kind: SyntaxNodeKind.WhileStatementSyntax, keyword, condition, body})
  }

  private parseForStatement() {
    const keyword = this.match(SyntaxKind.ForKeyword);
    this.match(SyntaxKind.ParenOpenToken);

    // init and condition are full statements are they are seperated by semicolons
    const init = this.parseExpressionStatement().expression;
    const condition = this.parseExpressionStatement().expression;
    // Afterthought an expression, not a statement, af its not ended by a semicolon
    const afterthought = this.parseExpression();

    this.match(SyntaxKind.ParenCloseToken);
    const body = this.parseStatement();

    return createStatementNode({kind: SyntaxNodeKind.ForStatementSyntax, keyword, init, condition, afterthought, body});
  }

  // Expressions
  private parseSingleExpression() {
    return this.parseAssignmentExpression();
  }

  private parseExpression(): ExpressionSyntax & SyntaxNode {
    return this.parseCommaExpression();
  }

  private parseCommaExpression(): ExpressionSyntax & SyntaxNode {
    const expression = this.parseSingleExpression();
    const commas = [] as SyntaxToken[]
    if (this.current().kind === SyntaxKind.CommaToken) {
      const expressions = [expression];
      do {
        commas.push(this.nextToken()); // Eat the comma
        expressions.push(this.parseSingleExpression());
      } while (this.current().kind === SyntaxKind.CommaToken)
      return createExpressionNode({kind: SyntaxNodeKind.CommaExpressionSyntax, expressions, commas});
    }

    return expression;
  }

  private isSequence<T extends Record<string, SyntaxToken>>(value: [key: keyof T, kind: SyntaxKind | SyntaxKind[], needed?: boolean][]) {
    const ret = {} as T;
    let index = 0;
    for (const [key, kind, needed = true] of value) {
      const token = this.peek(index);
      const kinds = Array.isArray(kind) ? kind : [kind];
      if (kinds.includes(token.kind)) {
        (ret[key] as SyntaxToken) = token;
        index++;
      } else if (needed) {
        return undefined;
      }
    }

    // Skip all tokens that are used
    for (let i = 0; i < index; i++) {
      this.nextToken();
    }
    return ret;
  }


  private parseAssignmentExpression(): ExpressionSyntax & SyntaxNode {
    const sequence = this.isSequence<PickByType<AssignmentExpressionSyntax, SyntaxToken>>(
      [ // $foo = expression
        // $foo [] = expression
        ['identifier', SyntaxKind.VariableToken],
        ['open', SyntaxKind.SquareOpenToken, false],
        ['close', SyntaxKind.SquareCloseToken, false],
        ['operator', [SyntaxKind.EqualToken]],
      ],
    );

    if (!sequence) {
      return this.parseBinaryExpression();
    }

    const {
      identifier,
      open,
      close,
      operator,
    } = sequence;
    const expression = this.parseAssignmentExpression();

    // ToDo; write right to left behavior for assignment
    return createExpressionNode({
      kind: SyntaxNodeKind.AssignmentExpressionSyntax,
      identifier,
      operator,
      expression,
      open,
      close,
    })
  }

  private parseUnaryExpression(parentPrecedence: number = 0): ExpressionSyntax & SyntaxNode {
    const unaryOperatorPrecedence = getUnaryOperatorPrecedence(this.current().kind, this.peek(1).kind);
    if (!(unaryOperatorPrecedence != 0 && unaryOperatorPrecedence >= parentPrecedence)) {
      return this.parsePrimaryExpression();
    }

    // Check if it is a unary infix fix operator (new a, -a, ++a)
    let next = this.peek(1);
    if (!canBePostFixOperator(next.kind)) {
      const operator = this.nextToken();
      const operand = this.parseBinaryExpression(unaryOperatorPrecedence);
      return createExpressionNode({kind: SyntaxNodeKind.UnaryExpressionSyntax, operator, operand, post: false});
    }

    // Postfix operators
    const literal = this.parsePrimaryExpression();
    this.nextToken();

    // while you only can do a++ or a--, call()?.something(), here ? is a valid postfix
    if (supportsOnlyNameExpression(next.kind) && literal.kind !== SyntaxNodeKind.NameExpressionSyntax) {
      const token = this.current();
      this.diagnostics.reportCanOnlyUsePostfixOnNameExpression(literal.span)
      return createExpressionNode({
        kind: SyntaxNodeKind.LiteralExpressionSyntax,
        type: TypeSymbol.error,
        value: null,
        token: token,
      })
    }

    return createExpressionNode({
      kind: SyntaxNodeKind.UnaryExpressionSyntax,
      operand: literal,
      operator: next,
      post: true,
    });


  }

  private parseBinaryExpression(parentPrecedence: number = 0): ExpressionSyntax & SyntaxNode {
    let left: ExpressionSyntax & SyntaxNode = this.parseUnaryExpression();

    while (true) {
      const precedence = getBinaryOperatorPrecedence(this.current().kind)
      if (precedence === 0 || precedence <= parentPrecedence) {
        break;
      }

      if (this.current().kind === SyntaxKind.ParenOpenToken) {
        // Function call is a different animal, as its left(right)
        // where other operators are left + right
        // use current and not next or match, as the "(" is also needed for the paren expression
        // Please note that multiple arguments will become parsed by the comma expression syntax
        const operator = this.current();
        const right = this.parseParenExpression();
        left = createExpressionNode({kind: SyntaxNodeKind.BinaryExpressionSyntax, left, operator, right})
      } else {
        const operator = this.nextToken();
        const right = this.parseBinaryExpression(precedence);
        left = createExpressionNode({kind: SyntaxNodeKind.BinaryExpressionSyntax, left, operator, right});
      }
    }

    return left;
  }

  private parseParenExpression(): ExpressionSyntax & SyntaxNode {
    const open = this.match(SyntaxKind.ParenOpenToken);

    // If syntax is (), it's an empty function call, or can be seen as an empty expression
    const expression = this.current().kind === SyntaxKind.ParenCloseToken
      ? createExpressionNode({kind: SyntaxNodeKind.EmptyExpressionSyntax, type: TypeSymbol.void})
      : this.parseExpression();


    const close = this.match(SyntaxKind.ParenCloseToken);
    return createExpressionNode({kind: SyntaxNodeKind.ParenExpressionSyntax, open, expression, close});
  }

  private parsePrimaryExpression(): ExpressionSyntax & SyntaxNode {
    let current = this.current();

    switch (current.kind) {
      case SyntaxKind.ParenOpenToken:
        return this.parseParenExpression();
      case SyntaxKind.FalseKeyword:
      case SyntaxKind.TrueKeyword:
        return this.parseBooleanLiteral();

      case SyntaxKind.StringToken:
        const string = this.match(SyntaxKind.StringToken);
        return createExpressionNode({
          kind: SyntaxNodeKind.LiteralExpressionSyntax,
          value: string.value,
          type: TypeSymbol.string,
          token: string,
        });

      case SyntaxKind.VariableToken:
        const variable = this.match(SyntaxKind.VariableToken);
        return createExpressionNode({kind: SyntaxNodeKind.NameExpressionSyntax, identifier: variable})

      case SyntaxKind.IdentifierToken:
        return createExpressionNode({kind: SyntaxNodeKind.NameExpressionSyntax, identifier: this.nextToken()})

      case SyntaxKind.SquareOpenToken:
        return this.parseArrayLiteral()
      default:
        const number = this.match(SyntaxKind.NumberToken);
        return createExpressionNode({
          kind: SyntaxNodeKind.LiteralExpressionSyntax,
          value: number,
          type: TypeSymbol.int,
          token: number
        })
    }
  }

  private parseBooleanLiteral() {
    const keyword = this.nextToken();
    const value = keyword.kind === SyntaxKind.TrueKeyword;
    return createExpressionNode({
      kind: SyntaxNodeKind.LiteralExpressionSyntax,
      value,
      type: TypeSymbol.bool,
      token: keyword
    })
  }


  // Parsing specific
  private match(kind: SyntaxKind) {
    const current = this.current();
    if (current.kind === kind) {
      return this.nextToken();
    }

    this.diagnostics.reportUnexpectedToken(current.span, current.kind, kind);
    return new SyntaxToken(kind, current.position, null, null);
  }

  private optional(kind: SyntaxKind) {
    const current = this.current();
    if (current.kind === kind) {
      return [true, this.nextToken()] as const;
    }
    return [false, undefined] as const;
  }

  private nextToken() {
    // Get rid of current whitespace, but we can depend on it on specific places, like we need whitespace
    const current = this.current();
    this.position++;
    return current;
  }

  private previous(offset: number) {
    const index = this.position - offset;
    if (index < 0) {
      return this.tokens[0];
    }

    return this.tokens[index];
  }

  private peek(offset: number): SyntaxToken {
    const index = this.position + offset;
    if (this.tokens.length <= index) {
      return this.tokens[this.tokens.length - 1];
    }

    return this.tokens[index];
  }

  private current() {
    return this.peek(0)
  }


  parseFile(): FileSyntax {
    let current = this.current();
    const body: StatementSyntax[] = [];
    let id = this.position;
    while (current.kind !== SyntaxKind.EOF) {
      const statement = this.parseStatement();
      body.push(statement);
      current = this.current();
      if (id === this.position) {
        this.diagnostics.reportParsingError(this.current().span)
        break;
      }
      id = this.position;
    }
    return createSpecialNode({
      kind: SyntaxNodeKind.FileSyntax,
      filename: this.source.file,
      depended: [],
      body
    })
  }

  private parseVariable() {
    return this.match(SyntaxKind.VariableToken);
  }

  parseParameters() {
    const parameters: ParametersSyntax[] = [];
    this.match(SyntaxKind.ParenOpenToken);
    if (this.current().kind !== SyntaxKind.ParenCloseToken) {
      do {

        const [, type] = this.optional(SyntaxKind.IdentifierToken);
        const name = this.parseVariable();
        parameters.push(createSpecialNode({kind: SyntaxNodeKind.ParameterSyntax, name, type}));

        // Stop on paren
        if (this.current().kind === SyntaxKind.ParenCloseToken) break;
        // stop on comma
        if (this.current().kind !== SyntaxKind.CommaToken) break;
        this.match(SyntaxKind.CommaToken);
      } while (true)
    }
    this.match(SyntaxKind.ParenCloseToken);
    return parameters;
  }

  parseOptionalTypeClause(): TypeClause | undefined {
    if (this.current().kind !== SyntaxKind.ColonToken) {
      return undefined;
    }
    return this.parseTypeClause();
  }

  parseTypeClause(): TypeClause {
    const colon = this.match(SyntaxKind.ColonToken);
    const identifier = this.match(SyntaxKind.IdentifierToken);

    return createSpecialNode({kind: SyntaxNodeKind.TypeClause, identifier})
  }

  private parseReturnStatement() {
    const keyword = this.match(SyntaxKind.ReturnKeyword);

    // Detect if next token is on the same line, if so, parse expression
    const currentLine = this.source.getLineNumber(keyword.position);
    const nextLine = this.source.getLineNumber(this.current().position);
    const parseExpression = this.current().kind !== SyntaxKind.EOF ? currentLine === nextLine : false;
    const expression = parseExpression ? this.parseExpression() : undefined;

    const semicolon = this.match(SyntaxKind.SemiColonToken);

    return createStatementNode({
      kind: SyntaxNodeKind.ReturnStatementSyntax,
      keyword,
      expression,
      semicolon,
    })
  }

  private parseEchoStatement() {
    const keyword = this.match(SyntaxKind.EchoKeyword)
    const expression = this.parseExpression();
    const semicolon = this.match(SyntaxKind.SemiColonToken);
    return createStatementNode<ExpressionStatementSyntax>({
      kind: SyntaxNodeKind.EchoStatementSyntax,
      expression,
      keyword,
      semicolon,
    });
  }

  private parseModifier(allowed: Modifiers) {

    for (const [kind, field] of Object.entries(ModifierMapping)) {
      if ((field & allowed) === field && this.current().kind === Number(kind)) {
        return this.nextToken();
      }
    }

    return undefined;
  }

  private parseModifiers(allowed: Modifiers) {
    const arr = [] as SyntaxToken[]
    for (let last = this.parseModifier(allowed); last; last = this.parseModifier(allowed)) {
      arr.push(last)
    }
    return arr;
  }


  private parseFunction(modifiers: SyntaxToken[] = []) {
    const keyword = this.match(SyntaxKind.FunctionKeyword);
    const identifier = this.match(SyntaxKind.IdentifierToken);
    const parameters = this.parseParameters()
    const type = this.parseOptionalTypeClause()
    const {statements, open, close} = this.parseBlockStatement();

    return createStatementNode({
      kind: SyntaxNodeKind.FunctionStatementSyntax,
      modifiers: modifiers,
      keyword,
      identifier,
      parameters,
      statements,
      type,
      open,
      close,
    })
  }

  private parseClassMember() {
    const modifiers = this.parseModifiers(Modifiers.AllowedOnMethod | Modifiers.AllowedOnProperty);

    if (this.current().kind === SyntaxKind.FunctionKeyword) {
      return this.parseFunction(modifiers)
    } else {
      const [hasType, type] = this.optional(SyntaxKind.IdentifierToken);
      if (this.current().kind !== SyntaxKind.VariableToken) {
        this.optional(SyntaxKind.SemiColonToken);
        return createStatementNode({
          kind: SyntaxNodeKind.LiteralExpressionSyntax,
          type: TypeSymbol.error,
          value: null,
          token: type,
        })
      }
      const identifier = this.parseVariable();
      const [hasInit, equal] = this.optional(SyntaxKind.EqualToken);
      const init = hasInit ? this.parseExpression() : undefined;

      const semicolon = this.match(SyntaxKind.SemiColonToken);
      return createStatementNode({
        kind: SyntaxNodeKind.PropertyStatementSyntax,
        identifier,
        modifiers,
        type,
        equal,
        init,
        semicolon,
      })
    }
  }

  private parseClassMembers() {
    const methods = [] as FunctionStatementSyntax[];
    const properties = [] as PropertyStatementSyntax[];
    do {
      if (this.current().kind === SyntaxKind.BraceCloseToken) {
        this.nextToken();
        break;
      }
      const member = this.parseClassMember();
      switch (member.kind) {
        case SyntaxNodeKind.FunctionStatementSyntax:
          methods.push(member);
          break;
        case SyntaxNodeKind.PropertyStatementSyntax:
          properties.push(member);
          break;
        default:
          this.diagnostics.reportExpectedPropertyOrMember(this.current().span)
          break;
      }
    } while (this.current().kind !== SyntaxKind.EOF)
    return {methods, properties};
  }

  private parseClassStatement() {
    // abstract/final can come before class statements
    const modifiers = this.lostModifiers;

    const keyword = this.match(SyntaxKind.ClassKeyword);
    const identifier = this.match(SyntaxKind.IdentifierToken);

    let extend: SyntaxToken;
    const implement: SyntaxToken[] = [];
    const [hasExtends, extendKeyword] = this.optional(SyntaxKind.ExtendsKeyword);
    if (hasExtends) {
      extend = this.match(SyntaxKind.IdentifierToken);
    }

    const [hasImplements, implementsKeyword] = this.optional(SyntaxKind.ImplementsKeyword);
    if (hasImplements) {
      do {
        implement.push(this.match(SyntaxKind.IdentifierToken));
      } while (this.current().kind === SyntaxKind.CommaToken);
    }

    this.match(SyntaxKind.BraceOpenToken);

    const {methods, properties} = this.parseClassMembers();
    return createStatementNode({
      kind: SyntaxNodeKind.ClassStatementSyntax,
      keyword,
      methods,
      extend,
      implementsKeyword,
      extendKeyword,
      implements: implement,
      modifiers,
      properties,
      identifier,
    })
  }

  private parseCaseStatement(): CaseStatementSyntax {
    const keyword = this.match(SyntaxKind.CaseKeyword);
    const expression = this.parseExpression();
    const colon = this.match(SyntaxKind.ColonToken);
    const statements: StatementSyntax[] = [];

    let current: SyntaxToken;
    while ((current = this.current())
    && current.kind !== SyntaxKind.CaseKeyword
    && current.kind !== SyntaxKind.BraceCloseToken
    && current.kind !== SyntaxKind.EOF) {
      statements.push(this.parseStatement());
    }
    return createStatementNode({
      kind: SyntaxNodeKind.CaseStatementSyntax,
      keyword,
      expression,
      colon,
      statements,
    });
  }

  private parseSwitchStatement() {
    const keyword = this.match(SyntaxKind.SwitchKeyword);
    const expression = this.parseParenExpression();

    const open = this.match(SyntaxKind.BraceOpenToken);
    const cases: CaseStatementSyntax[] = []
    while (this.current().kind !== SyntaxKind.BraceCloseToken) {
      cases.push(this.parseCaseStatement())
    }
    const close = this.match(SyntaxKind.BraceCloseToken);

    return createStatementNode({
      kind: SyntaxNodeKind.SwitchStatementSyntax,
      keyword,
      expression,
      open,
      close,
      cases,
    });
  }

  parseArrayMembers() {
    // [$foo->bar()] and [$foo->bar() => 4] and [5] and [5=>5] are all valid array syntax's
    // Since parsing is about syntax, simply handle these expressions
    // Since => is a binary operator, and comma expressions,
    // The entire content of array's can be parsed with a simple parse expression in the parser

    // Special case, empty array syntax
    if (this.current().kind === SyntaxKind.SquareCloseToken) {
      return createExpressionNode({
        kind: SyntaxNodeKind.EmptyExpressionSyntax,
        type: TypeSymbol.void,
      })
    }

    return this.parseExpression();
  }

  parseArrayLiteral() {
    const open = this.match(SyntaxKind.SquareOpenToken);


    return createExpressionNode({
      kind: SyntaxNodeKind.ArrayLiteralExpressionSyntax,
      open,
      members: this.parseArrayMembers(),
      close: this.match(SyntaxKind.SquareCloseToken),
    });
  }

  parseUseStatement() {
    return undefined;
  }
}