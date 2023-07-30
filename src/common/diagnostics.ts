import {TextSpan} from "./text-span.js";
import {TypeSymbol} from "../symbols/symbols.js";
import {SyntaxKind} from "../source/syntax/syntax.kind.js";


export class Diagnostics {
  public readonly items: { span: TextSpan, msg: string }[] = [];


  private report(span: TextSpan, msg: string) {
    this.items.push({span, msg});
  }


  reportUnterminatedString(span: TextSpan) {
    this.report(span, 'Unterminated string');
  }

  reportInvalidEscape(span: TextSpan) {
    this.report(span, 'Invalid escape');
  }

  reportCanOnlyUsePostfixOnNameExpression(span: TextSpan) {

  }

  reportUnexpectedToken(span: TextSpan, kind: SyntaxKind, kind2: SyntaxKind) {

  }

  reportNeedSemicolon(span: TextSpan) {

  }

  reportTypeDoesntExists(span: TextSpan, text: string) {

  }

  reportCannotRedeclare(span: TextSpan, text: string) {

  }

  reportUndefinedName(span: TextSpan, name: string) {

  }

  reportCannotAssign(span: TextSpan, name: string) {

  }

  reportCannotConvert(span: TextSpan, type: TypeSymbol, type2) {

  }

  reportUndefinedBinaryOperator(span: TextSpan, text: string, type: TypeSymbol, type2: TypeSymbol) {

  }

  reportUndefinedUnaryOperator(span: TextSpan, text: string) {

  }

  reportCannotContinue(span: TextSpan) {

  }

  reportCannotBreak(span: TextSpan) {

  }

  reportModifierNotAllowed(span: TextSpan, on: string) {
    this.report(span, `Modifier not allowed on ${on}`)
  }
}