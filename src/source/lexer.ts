import {TextSpan} from "../common/text-span.js";
import {Source} from "./source.js";
import {Diagnostics} from "../common/diagnostics.js";
import './syntax/keywords.js'
import {SyntaxKind} from "./syntax/syntax.kind.js";
import {KeywordsByName} from "./syntax/keywords.js";

function isLetter(c: string) {
  return c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z';
}

function isDigit(c: string) {
  return c >= '0' && c <= '9';
}

function isWhitespace(c: string) {
  return c === '\t' || c === '\r' || c === '\n' || c === ' ';
}

export function getKeywordKind(value: string) {
  return KeywordsByName[value] ?? SyntaxKind.IdentifierToken;
}

const cacheToken = new WeakMap<SyntaxToken, TextSpan>()

export class SyntaxToken {
  private name: string;

  constructor(
    public readonly kind: SyntaxKind,
    public readonly position: number,
    public readonly text: string,
    public readonly value: any,
  ) {
    this.name = SyntaxKind[this.kind];
  }

  get span() {
    let span = cacheToken.get(this);
    if (!span) cacheToken.set(this, span = new TextSpan(this.position, this.position + (this.text?.length ?? 0)));
    return span;
  }

  toString() {
    return SyntaxKind[this.kind]
  }

}

export class Lexer {
  private position: number = 0;
  private currentKind: SyntaxKind;
  private currentValue: any;
  private start: number;
  private pureText: boolean;

  constructor(
    public readonly source: Source,
    public readonly diagnostics: Diagnostics
  ) {
    // Always start with the good old plain php
    this.pureText = true;
  }

  peek(offset: number) {
    const index = this.position + offset;
    if (index >= this.source.text.length) {
      return '\0';
    }
    return this.source.text[index]
  }

  match(str: string) {
    const start = this.position;
    const end = Math.min(start + str.length, this.source.text.length - 1);
    const current = this.source.text.substring(start, end);

    return current == str;
  }

  current(): string {
    return this.peek(0);
  }

  lookahead() {
    return this.peek(1);
  }

  previous(offset = 1) {
    const index = this.position - offset;
    if (index < 0) {
      return '\0';
    }
    return this.source.text[index];
  }

  next() {
    this.position++;
  }

  lex(): SyntaxToken {

    if (this.position >= this.source.text.length) {
      return new SyntaxToken(SyntaxKind.EOF, this.position, "", null)
    }

    this.currentValue = null;
    this.start = this.position;

    // Strip to <?php tag
    if (this.pureText) {
      do {
        if (this.match('<?php')) {
          this.pureText = false;
          if (this.start !== this.position) {
            const text = this.source.get(this.start, this.position - this.start);
            return new SyntaxToken(SyntaxKind.RawToken, this.start, text, text);
          } else {
            this.position += 5;
            return new SyntaxToken(SyntaxKind.PhpOpenToken, this.start, '<?php', '<?php')
          }
        }
        this.position++;
      } while (this.current() !== '\0');

      // In the odd case the entire file contains no php opening tag
      const text = this.source.get(this.start, this.position - this.start);
      return new SyntaxToken(SyntaxKind.RawToken, this.start, text, text);
    }

    switch (this.current()) {
      case '\0':
        this.currentKind = SyntaxKind.EOF;
        this.position++;
        break;
      case '%':
        this.position++
        this.currentKind = SyntaxKind.PercentageToken;
        break;
      case '*':
        this.position++
        if (this.current() === '*') {
          this.position++
          this.currentKind = SyntaxKind.StarStarToken;
        } else {
          this.currentKind = SyntaxKind.StarToken;
        }
        break;
      case '.':
        this.position++
        this.currentKind = SyntaxKind.DotToken;
        break;
      case '/':
        if (this.current() === '/') {
          this.currentKind = SyntaxKind.CommentToken;
          do {
            this.position++;
          } while (this.current() !== '\r' && this.current() !== '\n');
        } else {
          this.position++
          this.currentKind = SyntaxKind.SlashToken;
        }
        break;
      case '(':
        this.position++
        this.currentKind = SyntaxKind.ParenOpenToken;
        break;
      case ')':
        this.position++
        this.currentKind = SyntaxKind.ParenCloseToken;
        break;
      case '{':
        this.position++
        this.currentKind = SyntaxKind.BraceOpenToken;
        break;
      case '}':
        this.position++
        this.currentKind = SyntaxKind.BraceCloseToken;
        break;
      case '[':
        this.position++
        this.currentKind = SyntaxKind.SquareOpenToken;
        break;
      case ']':
        this.position++
        this.currentKind = SyntaxKind.SquareCloseToken;
        break;
      case ',':
        this.position++
        this.currentKind = SyntaxKind.CommaToken;
        break;
      case '~':
        this.position++
        this.currentKind = SyntaxKind.TildeToken;
        break;
      case '^':
        this.position++
        this.currentKind = SyntaxKind.HatToken;
        break;
      case '+':
        this.position++;
        if (this.current() === '+') {
          this.position++;
          this.currentKind = SyntaxKind.PlusPlusToken;
        } else {
          this.currentKind = SyntaxKind.PlusToken;
        }
        break;
      case '-':
        this.position++;
        if (this.current() === '-') {
          this.position++;
          this.currentKind = SyntaxKind.MinusMinusToken;
        } else if (this.current() === '>') {
          this.position++;
          this.currentKind = SyntaxKind.ArrowToken
        } else {
          this.currentKind = SyntaxKind.MinusToken;
        }
        break;
      case '&':
        this.position++;
        if (this.current() === '&') {
          this.position++;
          this.currentKind = SyntaxKind.AmpersandAmpersandToken;
        } else {
          this.currentKind = SyntaxKind.AmpersandToken;
        }
        break;
      case '|':
        this.position++;
        if (this.current() === '|') {
          this.position++;
          this.currentKind = SyntaxKind.PipePipeToken;
        } else {
          this.currentKind = SyntaxKind.PipeToken;
        }
        break;
      case '=':
        this.position++;
        if (this.current() === '=') {
          this.position++;
          if (this.current() === '=') {
            this.currentKind = SyntaxKind.EqualEqualEqualToken;
            this.position++;
          } else {
            this.currentKind = SyntaxKind.EqualEqualToken;
          }
        } else if (this.current() === '>') {
          this.position++;
          this.currentKind = SyntaxKind.FatArrowToken;
        } else {
          this.currentKind = SyntaxKind.EqualToken;
        }
        break;
      case '!':
        this.position++;
        if (this.current() === '=') {
          this.position++;
          if (this.current() === '=') {
            this.position++;
            this.currentKind = SyntaxKind.ExclamationEqualEqualToken;
          } else {
            this.currentKind = SyntaxKind.ExclamationEqualToken;
          }
        } else {
          this.currentKind = SyntaxKind.ExclamationToken;
        }
        break;
      case '?':
        this.position++;
        if (this.current() === '?') {
          this.position++;
          this.currentKind = SyntaxKind.QuestionQuestionToken;
        } else {
          this.currentKind = SyntaxKind.QuestionToken;
        }
        break;
      case '<':
        this.position++;
        if (this.current() === '=') {
          this.position++;
          if (this.current() === '>') {
            this.currentKind = SyntaxKind.LessEqualGreaterToKen
          } else {
            this.currentKind = SyntaxKind.LessEqualToken;
          }
        } else {
          this.currentKind = SyntaxKind.LessToken;
        }
        break;
      case '>':
        this.position++;
        if (this.current() === '=') {
          this.position++;
          this.currentKind = SyntaxKind.GreaterEqualToken;
        } else {
          this.currentKind = SyntaxKind.GreaterToken;
        }
        break;
      case ';':
        this.currentKind = SyntaxKind.SemiColonToken;
        this.position++
        break;
      case ':':
        this.position++;
        if (this.current() === ':') {
          this.position++;
          this.currentKind = SyntaxKind.ColonColonToken;
        } else {
          this.currentKind = SyntaxKind.ColonToken;
        }
        break;
      case "'":
      case '"':
        this.readString(this.current());
        break;
      case '@':
        this.currentKind = SyntaxKind.AtToken;
        this.position++
        break;
      case '$':
        this.currentKind = SyntaxKind.VariableToken;
        this.readVariable();
        break;
      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        this.readNumber()
        break;
      case ' ':
      case '\t':
      case '\n':
      case '\r':
        this.readWhitespace();
        break;
      default:
        if (isLetter(this.current())) {
          this.readIdentifier()
        }
    }

    const length = this.position - this.start;
    if (length === 0) {
      console.log(this.source.text.substring(0, this.position))
      throw new Error('Bugged char? -' + this.current() + '-')
    }

    const text = this.source.get(this.start, length);
    return new SyntaxToken(this.currentKind, this.start, text, this.currentValue);
  }

  private readWhitespace() {
    while (isWhitespace(this.current())) {
      this.next();
    }
    this.currentKind = SyntaxKind.WhitespaceToken
  }

  private readNumber() {
    while (isDigit(this.current())) {
      this.next();
    }
    this.currentKind = SyntaxKind.NumberToken
  }

  private readString(start: string) {
    let literal = [];
    let done = false;
    this.position++;
    // let other = start === '"' ? "'" : '"';
    while (!done) {
      let current = this.current();
      switch (current) {
        case '\0':
        case '\r':
        case '\n':
          this.diagnostics.reportUnterminatedString(new TextSpan(this.start, 1));
          this.position++;
          done = true;
          break;
        case start:
          this.position++;
          done = true;
          break;
        case '\\':
          switch (this.peek(1)) {
            case '"':
            case "'":
            case '\\':
              // Skip this \ star, and take the literal of here
              this.position++;
              break;
            case 'r':
              this.position+=2;
              literal.push('\r');
              continue;
            case 'n':
              this.position+=2;
              literal.push('\n');
              continue;
            default:
              done = true;
              this.diagnostics.reportInvalidEscape(new TextSpan(this.position, 2));
          }
        // fallthrough
        default:
          this.position++;
          literal.push(current);
      }
    }
    this.currentValue = literal.join('');
    this.currentKind = SyntaxKind.StringToken
  }

  * [Symbol.iterator]() {
    let current: SyntaxToken;
    do {
      current = this.lex();
      if (current.kind === SyntaxKind.WhitespaceToken || current.kind === SyntaxKind.CommentToken) {
        continue;
      }
      yield current;
    } while (current.kind !== SyntaxKind.EOF)
  }

  private readValidIdentifier() {
    let first = 0;
    while (this.current() === '\\' || isLetter(this.current()) || (first++ === 0 && isDigit(this.current())) || this.current() === '_') {
      this.next();
    }
  }

  private readVariable() {
    do {
      this.next();
    } while (this.current() == '$')

    this.readValidIdentifier();
  }

  private readIdentifier() {
    this.readValidIdentifier()

    const length = this.position - this.start;
    const text = this.source.get(this.start, length);
    this.currentKind = getKeywordKind(text);
  }
}