import {SyntaxKind} from "./lexer.js";

const enum PrecedenceKind {
  None,
  LogicalOr,
  LogicalAnd,

  BitwiseAnd,
  BitwiseOr,
  BitwiseXor,

  Equality,
  AdditionSubtraction,
  MultiplicationDivision,

  Unary,
  Prefix,
  Postfix,
  FunctionCall,
}

export function getUnaryOperatorPrecedence(kind: SyntaxKind, next: SyntaxKind) {
  switch (kind) {
    case SyntaxKind.PlusPlusToken:
    case SyntaxKind.MinusMinusToken:
      return PrecedenceKind.Prefix;

    case SyntaxKind.PlusToken:
    case SyntaxKind.MinusToken:
    case SyntaxKind.TildeToken:
      return PrecedenceKind.Unary;

    default:
      switch(next) {
        case SyntaxKind.PlusPlusToken:
        case SyntaxKind.MinusMinusToken:
          return PrecedenceKind.Postfix
        default:
          return PrecedenceKind.None;
      }
  }
}

export function getBinaryOperatorPrecedence(kind: SyntaxKind) {
  switch (kind) {
    case SyntaxKind.PipePipeToken:
      return PrecedenceKind.LogicalOr;

    case SyntaxKind.AmpersandAmpersandToken:
      return PrecedenceKind.LogicalAnd;

    case SyntaxKind.AmpersandToken:
      return PrecedenceKind.BitwiseAnd;
    case SyntaxKind.PipeToken:
      return PrecedenceKind.BitwiseOr;
    case SyntaxKind.HatToken:
      return PrecedenceKind.BitwiseXor;

    case SyntaxKind.PlusToken:
    case SyntaxKind.MinusToken:
      return PrecedenceKind.AdditionSubtraction;

    case SyntaxKind.EqualEqualToken:
    case SyntaxKind.ExclamationEqualToken:
    case SyntaxKind.LessToken:
    case SyntaxKind.LessEqualToken:
    case SyntaxKind.GreaterToken:
    case SyntaxKind.GreaterEqualToken:
      return PrecedenceKind.Equality;

    case SyntaxKind.StarToken:
    case SyntaxKind.SlashToken:
      return PrecedenceKind.MultiplicationDivision;

    case SyntaxKind.ParenLToken:
      return PrecedenceKind.FunctionCall;

    default:
      return PrecedenceKind.None;
  }
}

export function getKeywordKind(value: string) {
  switch (value) {
    case 'break':
      return SyntaxKind.BreakKeyword;
    case 'const':
      return SyntaxKind.ConstKeyword;
    case 'continue':
      return SyntaxKind.ContinueKeyword;
    case 'else':
      return SyntaxKind.ElseKeyword;
    case 'false':
      return SyntaxKind.FalseKeyword;
    case 'for':
      return SyntaxKind.ForKeyword;
    case 'if':
      return SyntaxKind.IfKeyword;
    case 'let':
      return SyntaxKind.LetKeyword;
    case 'method':
      return SyntaxKind.MethodKeyword;
    case 'return':
      return SyntaxKind.ReturnKeyword;
    case 'true':
      return SyntaxKind.TrueKeyword;
    case 'while':
      return SyntaxKind.WhileKeyword;
    default:
      return SyntaxKind.IdentifierToken
  }
}

export function canBePostFixOperator(kind: SyntaxKind) {
  switch (kind) {
    case SyntaxKind.PlusPlusToken:
    case SyntaxKind.MinusMinusToken:
    case SyntaxKind.QuestionToken:
      return true;
    default:
      return false
  }
}

export function supportsOnlyNameExpression(kind: SyntaxKind) {
  switch(kind) {
    case SyntaxKind.PlusPlusToken:
    case SyntaxKind.MinusMinusToken:
    case SyntaxKind.EqualToken:
      return true;
  }
}