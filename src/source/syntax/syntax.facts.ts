import {SyntaxKind} from "./syntax.kind.js";

const enum PrecedenceKind {
  None,

  // In theory here is a Comma operator, but its so low and special it's handled before other operators
  Comma,
  Assignment,

  // for array access [$foo->bar() => 5]
  FatArrow,

  LogicalOr,
  LogicalAnd,
  At,

  BitwiseAnd,
  BitwiseOr,
  BitwiseXor,

  Equality,
  AdditionSubtraction, // Plus Minus Concatenation(.)
  MultiplicationDivision,
  Exponentiation,

  Unary,
  Prefix,
  Postfix,
  New,
  FunctionCallMemberAccess,

  // In theory here is a Group operator, but it's not handled as operator internally
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

    case SyntaxKind.AtToken:
      return PrecedenceKind.At;

    case SyntaxKind.NewKeyword:
      return PrecedenceKind.New

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

export enum OperatorOrder {
  None,
  LeftToRight,
  RightToLeft,
}

export function getOperatorOrder(kind: SyntaxKind): OperatorOrder {
  if ( //
    kind === SyntaxKind.EqualToken
  ) {
    return OperatorOrder.RightToLeft;
  }
  return OperatorOrder.LeftToRight;
}

export function getBinaryOperatorPrecedence(kind: SyntaxKind) {
  switch (kind) {
    case SyntaxKind.EqualToken:
      return PrecedenceKind.Assignment;

    case SyntaxKind.QuestionQuestionToken:
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
    case SyntaxKind.DotToken:
      return PrecedenceKind.AdditionSubtraction;

    case SyntaxKind.EqualEqualToken:
    case SyntaxKind.EqualEqualEqualToken:
    case SyntaxKind.ExclamationEqualToken:
    case SyntaxKind.ExclamationEqualEqualToken:
    case SyntaxKind.LessToken:
    case SyntaxKind.LessEqualToken:
    case SyntaxKind.GreaterToken:
    case SyntaxKind.GreaterEqualToken:
    case SyntaxKind.LessEqualGreaterToKen:
      return PrecedenceKind.Equality;

    case SyntaxKind.StarStarToken:
      return PrecedenceKind.Exponentiation;

    case SyntaxKind.StarToken:
    case SyntaxKind.SlashToken:
    case SyntaxKind.PercentageToken:
      return PrecedenceKind.MultiplicationDivision;

    case SyntaxKind.ParenOpenToken:
      return PrecedenceKind.FunctionCallMemberAccess;

    // It's not really considered an operator in PHP, but, to parse it, treat it as one
    case SyntaxKind.ArrowToken:
    case SyntaxKind.ColonColonToken:
      return PrecedenceKind.FunctionCallMemberAccess;

    case SyntaxKind.FatArrowToken:
      return PrecedenceKind.FatArrow;
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
  TranspilerSync = 1 << 10,
  TranspilerExpose = 1 << 11,

  AllowedInClass = Abstract | Final,
  AllowedOnMethod = Abstract | Final | Public | Protected | Private | Static,
  AllowedOnProperty = Static | Readonly | Public | Private | Protected,
  AllowedInBinaryExpression = New,
}

export function isModifierSet({modifiers: a}: { modifiers: Modifiers }, b: Modifiers) {
  return (a & b) === b;
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