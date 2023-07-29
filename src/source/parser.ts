import {Source} from "./source.js";
import {SyntaxKind, SyntaxToken} from "./lexer.js";
import {Diagnostics} from "../common/diagnostics.js";
import {
  BlockStatementSyntax,
  ExpressionStatementSyntax, MethodStatementSyntax,
  StatementSyntax,
  VariableStatementSyntax
} from "./statement.syntax.js";
import {
  createExpressionNode,
  createSpecialNode,
  createStatementNode,
  SyntaxNode,
  SyntaxNodeKind
} from "./syntax.node.js";
import {ElseClause, FileSyntax, ParametersSyntax, TypeClause} from "./special.syntax.js";
import {ExpressionSyntax} from "./expression.syntax.js";
import {
  canBePostFixOperator,
  getBinaryOperatorPrecedence,
  getUnaryOperatorPrecedence,
  supportsOnlyNameExpression
} from "./syntax.facts.js";
import {TypeSymbol} from "../symbols/symbols.js";


export class Parser {
  private position: number = 0;

  constructor(
    public readonly source: Source,
    public readonly tokens: SyntaxToken[],
    private diagnostics: Diagnostics,
  ) {

  }

  // Statements
  private parseStatement(): StatementSyntax {
    switch (this.current().kind) {
      case SyntaxKind.PhpOpenToken:
        // For now just skip, later convert to a big echo statement
        this.match(SyntaxKind.PhpOpenToken)
        return this.parseStatement();
      case SyntaxKind.BraceLToken:
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
      case SyntaxKind.MethodKeyword:
        return this.parseMethod();
      case SyntaxKind.ReturnKeyword:
        return this.parseReturnStatement();
      case SyntaxKind.EchoKeyword:
        return this.parseEchoStatement();
    }
    return this.parseExpressionStatement()
  }

  private parseBlockStatement(): BlockStatementSyntax {
    const statements = [] as StatementSyntax[];

    const open = this.match(SyntaxKind.BraceLToken);
    while (this.current().kind !== SyntaxKind.EOF && this.current().kind !== SyntaxKind.BraceRToken) {

      const start = this.current();
      const statement = this.parseStatement();
      statements.push(statement);

      // Avoid infinite loops on bugged statements
      if (this.current() === start) {
        this.nextToken();
      }

    }
    const close = this.match(SyntaxKind.BraceRToken)

    this.hoistMethods(statements);
    return createStatementNode<BlockStatementSyntax>({
      kind: SyntaxNodeKind.BlockStatementSyntax,
      open,
      statements,
      close,
    })
  }

  private parseVariableDeclaration(): VariableStatementSyntax {
    const keyword = this.nextToken();
    const identifier = this.match(SyntaxKind.IdentifierToken);
    const equal = this.match(SyntaxKind.EqualToken);
    const init = this.parseExpression();
    this.matchSemicolonOrEnterEnding();

    return createStatementNode({kind: SyntaxNodeKind.VariableStatementSyntax, keyword, identifier, equal, init});
  }

  private parseSemiColonStatement() {
    this.match(SyntaxKind.SemiColonToken);
    return createStatementNode({kind: SyntaxNodeKind.SemiColonSyntax})
  }

  private parseBreakStatement() {
    const keyword = this.match(SyntaxKind.BreakKeyword);
    return createStatementNode({kind: SyntaxNodeKind.BreakStatementSyntax, keyword})
  }

  private parseContinueStatement() {
    const keyword = this.match(SyntaxKind.ContinueKeyword);
    return createStatementNode({kind: SyntaxNodeKind.ContinueStatementSyntax, keyword})
  }

  private parseExpressionStatement() {
    const expression = this.parseExpression();
    this.matchSemicolonOrEnterEnding();
    return createStatementNode<ExpressionStatementSyntax>({kind: SyntaxNodeKind.ExpressionStatementSyntax, expression});
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
    this.match(SyntaxKind.ParenLToken);

    const init = this.parseVariableDeclaration();
    const condition = this.parseExpressionStatement().expression;
    const afterthought = this.parseExpression();


    this.match(SyntaxKind.ParenRToken);
    const body = this.parseStatement();

    return createStatementNode({kind: SyntaxNodeKind.ForStatementSyntax, keyword, init, condition, afterthought, body});
  }

  // Expressions
  private parseSingleExpression() {
    return this.parseAssignmentExpression();
  }

  private parseExpression(): ExpressionSyntax {
    return this.parseCommaExpression();
  }

  private parseCommaExpression(): ExpressionSyntax {
    const expression = this.parseSingleExpression();
    if (this.current().kind === SyntaxKind.CommaToken) {
      const expressions = [expression];
      do {
        this.nextToken(); // Eat the comma
        expressions.push(this.parseSingleExpression());
      } while (this.current().kind === SyntaxKind.CommaToken)
      return createExpressionNode({kind: SyntaxNodeKind.CommaExpressionSyntax, expressions});
    }

    return expression;
  }

  private parseAssignmentExpression(): ExpressionSyntax & SyntaxNode {
    if (this.peek(0).kind == SyntaxKind.IdentifierToken
      && this.peek(1).kind == SyntaxKind.EqualToken) {

      const identifier = this.nextToken();
      const operator = this.nextToken();
      const expression = this.parseAssignmentExpression();

      return createExpressionNode({
        kind: SyntaxNodeKind.AssignmentExpressionSyntax,
        identifier,
        operator,
        expression,
      })
    }

    return this.parseBinaryExpression();
  }

  private parseBinaryExpression(parentPrecedence: number = 0): ExpressionSyntax & SyntaxNode {
    let left: ExpressionSyntax & SyntaxNode;

    const unaryOperatorPrecedence = getUnaryOperatorPrecedence(this.current().kind, this.peek(1).kind);
    if (unaryOperatorPrecedence != 0 && unaryOperatorPrecedence >= parentPrecedence) {

      // Check if it is a unary post fix operator (a++, a--, a?)

      let next = this.peek(1);
      if (canBePostFixOperator(next.kind)) {
        const literal = this.parsePrimaryExpression();
        this.nextToken();

        // while you only can do a++ or a--, call()?.something(), here ? is a valid postfix
        if (supportsOnlyNameExpression(next.kind) && literal.kind !== SyntaxNodeKind.NameExpressionSyntax) {
          this.diagnostics.reportCanOnlyUsePostfixOnNameExpression(literal.span)
          left = createExpressionNode({
            kind: SyntaxNodeKind.LiteralExpressionSyntax,
            type: TypeSymbol.error,
            value: null
          })
        } else {
          left = createExpressionNode({
            kind: SyntaxNodeKind.UnaryExpressionSyntax,
            operand: literal,
            operator: next,
            post: true
          });
        }
      } else {
        const operator = this.nextToken();
        const operand = this.parseBinaryExpression(unaryOperatorPrecedence);
        left = createExpressionNode({kind: SyntaxNodeKind.UnaryExpressionSyntax, operator, operand, post: false});
      }
    } else {
      left = this.parsePrimaryExpression();
    }

    while (true) {
      const precedence = getBinaryOperatorPrecedence(this.current().kind)
      if (precedence === 0 || precedence <= parentPrecedence) {
        break;
      }

      if (this.current().kind === SyntaxKind.ParenLToken) {
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
    const left = this.match(SyntaxKind.ParenLToken);

    // If syntax is (), it's an empty function call, or can be seen as an empty expression
    const expression = this.current().kind === SyntaxKind.ParenRToken
      ? createExpressionNode({kind: SyntaxNodeKind.EmptyExpressionSyntax, type: TypeSymbol.void})
      : this.parseExpression();


    const right = this.match(SyntaxKind.ParenRToken);
    return createExpressionNode({kind: SyntaxNodeKind.ParenExpressionSyntax, left, expression, right});
  }

  private parsePrimaryExpression(): ExpressionSyntax & SyntaxNode {
    const current = this.current();

    switch (current.kind) {
      case SyntaxKind.ParenLToken:
        return this.parseParenExpression();
      case SyntaxKind.FalseKeyword:
      case SyntaxKind.TrueKeyword:
        return this.parseBooleanLiteral();

      case SyntaxKind.StringToken:
        const string = this.match(SyntaxKind.StringToken);
        return createExpressionNode({
          kind: SyntaxNodeKind.LiteralExpressionSyntax,
          value: string,
          type: TypeSymbol.string
        });

      case SyntaxKind.IdentifierToken:
        return createExpressionNode({kind: SyntaxNodeKind.NameExpressionSyntax, id: this.nextToken()})
      default:
        const number = this.match(SyntaxKind.NumberToken);
        return createExpressionNode({kind: SyntaxNodeKind.LiteralExpressionSyntax, value: number, type: TypeSymbol.int})
    }
  }

  private parseBooleanLiteral() {
    const keyword = this.nextToken();
    const value = keyword.kind === SyntaxKind.TrueKeyword;
    return createExpressionNode({kind: SyntaxNodeKind.LiteralExpressionSyntax, value, type: TypeSymbol.bool})
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

  private matchSemicolonOrEnterEnding() {
    // Statements are ended by a ";" or enter or EOF;
    let current = this.current();

    // An expression can end in a space and then a semicolon. That is valid.
    // Once it hits another token, it's not a semicolon
    if (current.kind !== SyntaxKind.EOF && current.kind !== SyntaxKind.SemiColonToken) {

      // Check if enter
      const previous = this.previous(1);
      const previousLine = this.source.getLineNumber(previous.position);
      const currentLine = this.source.getLineNumber(current.position);
      // Need semicolon if it's on the same line
      if (previousLine == currentLine) {
        this.diagnostics.reportNeedSemicolon(current.span);
      }
    }

    if (current.kind === SyntaxKind.SemiColonToken) {
      this.nextToken();
    }
  }

  hoistMethods(statements: StatementSyntax[]) {
    statements.sort((a, b): number => {
      const aIs = a.kind === SyntaxNodeKind.MethodStatementSyntax;
      const bIs = b.kind === SyntaxNodeKind.MethodStatementSyntax;
      // Either both a method, or both not
      if (aIs === bIs) return 0;
      // move method up, or non method down
      return aIs ? -1 : 1
    })
  }

  parseFile(): FileSyntax {
    let current = this.current();
    const body: StatementSyntax[] = [];
    while (current.kind !== SyntaxKind.EOF) {
      const statement = this.parseStatement();
      body.push(statement);
      current = this.current();
    }
    this.hoistMethods(body);
    return createSpecialNode({
      kind: SyntaxNodeKind.FileSyntax,
      filename: this.source.file,
      depended: [],
      body
    })
  }

  parseParameters() {
    const parameters: ParametersSyntax[] = [];
    this.match(SyntaxKind.ParenLToken);
    if (this.current().kind !== SyntaxKind.ParenRToken) {
      do {
        const name = this.match(SyntaxKind.IdentifierToken);
        const type = this.parseTypeClause();
        parameters.push(createSpecialNode({kind: SyntaxNodeKind.ParameterSyntax, name, type}));

        // Stop on paren
        if (this.current().kind === SyntaxKind.ParenRToken) break;
        // stop on comma
        if (this.current().kind !== SyntaxKind.CommaToken) break;
        this.match(SyntaxKind.CommaToken);
      } while (true)
    }
    this.match(SyntaxKind.ParenRToken);
    return parameters;
  }

  parseMethod(): MethodStatementSyntax {
    const keyword = this.match(SyntaxKind.MethodKeyword);
    const identifier = this.match(SyntaxKind.IdentifierToken);
    const parameters = this.parseParameters();
    // return type
    const type = this.parseOptionalTypeClause()
    const body = this.parseBlockStatement();

    return createStatementNode({
      kind: SyntaxNodeKind.MethodStatementSyntax,
      body,
      type,
      identifier,
      keyword,
      parameters,
      modifiers: []
    })
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

    this.matchSemicolonOrEnterEnding()

    return createStatementNode({
      kind: SyntaxNodeKind.ReturnStatementSyntax,
      keyword,
      expression,
    })
  }

  private parseEchoStatement() {
    const keyword = this.match(SyntaxKind.EchoKeyword)
    const expression = this.parseExpression();
    this.matchSemicolonOrEnterEnding();
    return createStatementNode<ExpressionStatementSyntax>({
      kind: SyntaxNodeKind.EchoStatementSyntax,
      expression,
      keyword
    });
  }
}