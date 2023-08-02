import {SyntaxKind} from "./syntax.kind.js";

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
  NewCall,
  FunctionCall,
  MemberAccess,
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

    case SyntaxKind.NewKeyword:
      return PrecedenceKind.NewCall

    default:
      switch (next) {
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

    // It's not really considered an operator in PHP, but, to parse it, treat it as one
    case SyntaxKind.ArrowToken:
    case SyntaxKind.ColonColonToken:
      return PrecedenceKind.MemberAccess;

    default:
      return PrecedenceKind.None;
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
  switch (kind) {
    case SyntaxKind.PlusPlusToken:
    case SyntaxKind.MinusMinusToken:
    case SyntaxKind.EqualToken:
      return true;
  }
}

export enum Modifiers {
  None = 0,
  Abstract = 1 << 0,
  Final = 1 << 1,
  Private = 1 << 2,
  Protected = 1 << 3,
  Public = 1 << 4,
  Readonly = 1 << 5,
  Static = 1 << 6,
  New = 1 << 7,

  // Dont convert
  TranspilerInternal = 1 << 8,
  TranspilerParen = 1 << 9,

  AllowedInClass = Abstract | Final,
  AllowedOnMethod = Abstract | Final | Public | Protected | Private | Static,
  AllowedOnProperty = Static | Readonly | Public | Private | Protected,
  AllowedInBinaryExpression = New,
}

export const ModifiersCollides = [
  Modifiers.Public | Modifiers.Protected | Modifiers.Private,
  Modifiers.Final | Modifiers.Abstract
]

export const ModifierMapping = {
  [SyntaxKind.AbstractKeyword]: Modifiers.Abstract,
  [SyntaxKind.FinalKeyword]: Modifiers.Final,
  [SyntaxKind.PrivateKeyword]: Modifiers.Private,
  [SyntaxKind.ProtectedKeyword]: Modifiers.Protected,
  [SyntaxKind.PublicKeyword]: Modifiers.Public,
  [SyntaxKind.ReadonlyKeyword]: Modifiers.Readonly,
  [SyntaxKind.StaticKeyword]: Modifiers.Static,
  [SyntaxKind.NewKeyword]: Modifiers.New,
}