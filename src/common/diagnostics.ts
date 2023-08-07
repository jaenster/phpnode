import {TextSpan} from "./text-span.js";
import {TypeSymbol} from "../symbols/symbols.js";
import {SyntaxKind} from "../source/syntax/syntax.kind.js";


export class Diagnostics {
  public readonly items: { span: TextSpan, msg: string }[] = [];


  private report(span: TextSpan, msg: string) {
    this.items.push({span, msg});
  }

  reportParsingError(span: TextSpan){
    this.report(span, 'Unable to parse');
  }

  reportUnterminatedString(span: TextSpan) {
    this.report(span, 'Unterminated string');
  }

  reportInvalidEscape(span: TextSpan) {
    this.report(span, 'Invalid escape');
  }

  reportCanOnlyUsePostfixOnNameExpression(span: TextSpan) {
    this.report(span, `Cannot use postfix on anything other as a named expression`)
  }

  reportUnexpectedToken(span: TextSpan, kind: SyntaxKind, kind2: SyntaxKind) {
    this.report(span, `Unexpected token ${SyntaxKind[kind]}, expected ${SyntaxKind[kind2]}`);
  }

  reportNeedSemicolon(span: TextSpan) {
    this.report(span, 'Needed semicolon');
  }

  reportTypeDoesntExists(span: TextSpan, type: string) {
    this.report(span, `type ${type} does not exists`);
  }

  reportCannotRedeclare(span: TextSpan, text: string) {
    this.report(span, `Cant redeclare ${text}}`);
  }

  reportUndefinedName(span: TextSpan, name: string) {
    this.report(span, `Undefined name ${name}`);
  }

  reportCannotAssign(span: TextSpan, name: string) {
    this.report(span, `Cannot assign ${name}`);
  }

  reportCannotConvert(span: TextSpan, type: TypeSymbol, type2: TypeSymbol) {
    this.report(span, `Cannot convert ${type} to ${type2}`);
  }

  reportUndefinedBinaryOperator(span: TextSpan, text: string, type: TypeSymbol, type2: TypeSymbol) {
    this.report(span, `Undefined operator for ${type} ${text} ${type2}`);
  }

  reportUndefinedUnaryOperator(span: TextSpan, text: string) {
    this.report(span, `undefined operator for ${text}`);
  }

  reportCannotBreak(span: TextSpan) {
    this.report(span, `cannot break without being in a loop or switch`);
  }
  reportCannotContinue(span: TextSpan) {
    this.report(span, `cannot break without being in a loop`);
  }

  reportModifierNotAllowed(span: TextSpan, on: string) {
    this.report(span, `Modifier not allowed on ${on}`)
  }

  reportExpectedPropertyOrMember(span: TextSpan) {
    this.report(span, `Expected property or modifier`);
  }

  reportCannotBreakOnThisDepth(span: TextSpan) {
    this.report(span, `Cannot break on this depth`);
  }

  reportCannotContinueOnThisDepth(span: TextSpan) {
    this.report(span, `Cannot break on this depth`);
  }
}