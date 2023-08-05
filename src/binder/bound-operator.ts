import {TypeSymbol} from "../symbols/symbols.js";
import {BoundExpression} from "./bound-expression.js";
import {SyntaxKind} from "../source/syntax/syntax.kind.js";

export enum BoundBinaryOperatorKind {
  Addition,
  Subtraction,
  Concatenation,
  Multiplication,
  Division,
  LogicalAnd,
  LogicalOr,
  Equals,
  NotEquals,
  Less,
  LessEqual,
  Greater,
  GreaterEqual,
  BitwiseAnd,
  BitwiseOr,
  BitwiseXor,
  MethodCall,
  FunctionCall,
  MemberAccess,
  StaticMemberAccess,
}

function isType(type1: TypeSymbol, type2: TypeSymbol) {
  return type1 === type2 || type1 === TypeSymbol.any || type2 === TypeSymbol.any;
}


export class BoundBinaryOperator {
  private name: string;

  private constructor(
    public readonly syntaxKind: SyntaxKind,
    public readonly kind: BoundBinaryOperatorKind,
    public readonly leftType: TypeSymbol,
    public readonly rightType?: TypeSymbol,
    public readonly resultType?: TypeSymbol,
  ) {

    this.rightType ??= leftType;
    this.resultType ??= leftType;
    this.name = BoundBinaryOperatorKind[kind];
  }

  static call = new BoundBinaryOperator(SyntaxKind.ParenLToken, BoundBinaryOperatorKind.FunctionCall, TypeSymbol.func);
  static memberCall = new BoundBinaryOperator(SyntaxKind.ParenLToken, BoundBinaryOperatorKind.MethodCall, TypeSymbol.any);
  static addition = new BoundBinaryOperator(SyntaxKind.PlusToken, BoundBinaryOperatorKind.Addition, TypeSymbol.any);

  private static operator = [
    new BoundBinaryOperator(SyntaxKind.PlusToken, BoundBinaryOperatorKind.Addition, TypeSymbol.int),
    new BoundBinaryOperator(SyntaxKind.PlusToken, BoundBinaryOperatorKind.Addition, TypeSymbol.string, TypeSymbol.int, TypeSymbol.string),


    new BoundBinaryOperator(SyntaxKind.MinusToken, BoundBinaryOperatorKind.Subtraction, TypeSymbol.int),
    new BoundBinaryOperator(SyntaxKind.StarToken, BoundBinaryOperatorKind.Multiplication, TypeSymbol.int),
    new BoundBinaryOperator(SyntaxKind.SlashToken, BoundBinaryOperatorKind.Division, TypeSymbol.int),
    new BoundBinaryOperator(SyntaxKind.AmpersandToken, BoundBinaryOperatorKind.BitwiseAnd, TypeSymbol.int),
    new BoundBinaryOperator(SyntaxKind.PipeToken, BoundBinaryOperatorKind.BitwiseOr, TypeSymbol.int),
    new BoundBinaryOperator(SyntaxKind.HatToken, BoundBinaryOperatorKind.BitwiseXor, TypeSymbol.int),

    new BoundBinaryOperator(SyntaxKind.EqualEqualToken, BoundBinaryOperatorKind.Equals, TypeSymbol.int, TypeSymbol.int, TypeSymbol.bool),
    new BoundBinaryOperator(SyntaxKind.ExclamationEqualToken, BoundBinaryOperatorKind.NotEquals, TypeSymbol.int, TypeSymbol.int, TypeSymbol.bool),
    new BoundBinaryOperator(SyntaxKind.LessToken, BoundBinaryOperatorKind.Less, TypeSymbol.int, TypeSymbol.int, TypeSymbol.bool),
    new BoundBinaryOperator(SyntaxKind.LessEqualToken, BoundBinaryOperatorKind.LessEqual, TypeSymbol.int, TypeSymbol.int, TypeSymbol.bool),
    new BoundBinaryOperator(SyntaxKind.GreaterToken, BoundBinaryOperatorKind.Greater, TypeSymbol.int, TypeSymbol.int, TypeSymbol.bool),
    new BoundBinaryOperator(SyntaxKind.GreaterEqualToken, BoundBinaryOperatorKind.GreaterEqual, TypeSymbol.int, TypeSymbol.int, TypeSymbol.bool),

    new BoundBinaryOperator(SyntaxKind.AmpersandToken, BoundBinaryOperatorKind.BitwiseAnd, TypeSymbol.bool),
    new BoundBinaryOperator(SyntaxKind.AmpersandAmpersandToken, BoundBinaryOperatorKind.LogicalAnd, TypeSymbol.bool),
    new BoundBinaryOperator(SyntaxKind.PipeToken, BoundBinaryOperatorKind.BitwiseOr, TypeSymbol.bool),
    new BoundBinaryOperator(SyntaxKind.PipePipeToken, BoundBinaryOperatorKind.LogicalOr, TypeSymbol.bool),
    new BoundBinaryOperator(SyntaxKind.HatToken, BoundBinaryOperatorKind.BitwiseXor, TypeSymbol.bool),
    new BoundBinaryOperator(SyntaxKind.EqualEqualToken, BoundBinaryOperatorKind.Equals, TypeSymbol.bool),
    new BoundBinaryOperator(SyntaxKind.ExclamationEqualToken, BoundBinaryOperatorKind.NotEquals, TypeSymbol.bool),

    this.addition,
    new BoundBinaryOperator(SyntaxKind.DotToken, BoundBinaryOperatorKind.Concatenation, TypeSymbol.any, TypeSymbol.any, TypeSymbol.string),

    new BoundBinaryOperator(SyntaxKind.ArrowToken, BoundBinaryOperatorKind.MemberAccess, TypeSymbol.any),
    new BoundBinaryOperator(SyntaxKind.ColonColonToken, BoundBinaryOperatorKind.StaticMemberAccess, TypeSymbol.any),
    this.memberCall,
    this.call,
  ]

  static getByOperatorKind(kind: BoundBinaryOperatorKind, type: TypeSymbol = TypeSymbol.any) {
    for (const op of this.operator) {
      if (op.kind === kind && isType(op.leftType, type)) {
        return op;
      }
    }
  }

  static bind(syntaxKind: SyntaxKind, left: BoundExpression, right: BoundExpression) {
    for (const op of this.operator) {
      if (op.syntaxKind === syntaxKind && isType(op.leftType, left.type)) {
        // Simple operators
        if (isType(op.rightType, right.type)) return op;
      }
    }
  }
}

export enum BoundUnaryOperatorKind {
  LogicalNegation,
  Identity,
  Negation,
  OnesComplement,
  PrefixIncrease,
  PrefixDecrease,
  PostFixIncrease,
  PostFixDecrease,

  Optional,
  New,
}

export class BoundUnaryOperator {
  public readonly name: string

  private constructor(
    public readonly syntaxKind: SyntaxKind,
    public readonly kind: BoundUnaryOperatorKind,
    public readonly opType: TypeSymbol,
    public readonly resultType?: TypeSymbol,
    public readonly post: boolean = false,
  ) {
    this.name = BoundUnaryOperatorKind[kind];
    this.resultType ??= opType;
  }

  private static operator = [
    new BoundUnaryOperator(SyntaxKind.ExclamationToken, BoundUnaryOperatorKind.LogicalNegation, TypeSymbol.bool),

    new BoundUnaryOperator(SyntaxKind.PlusToken, BoundUnaryOperatorKind.Identity, TypeSymbol.int),
    new BoundUnaryOperator(SyntaxKind.MinusToken, BoundUnaryOperatorKind.Negation, TypeSymbol.int),
    new BoundUnaryOperator(SyntaxKind.TildeToken, BoundUnaryOperatorKind.OnesComplement, TypeSymbol.int),

    new BoundUnaryOperator(SyntaxKind.PlusPlusToken, BoundUnaryOperatorKind.PrefixIncrease, TypeSymbol.int),
    new BoundUnaryOperator(SyntaxKind.MinusMinusToken, BoundUnaryOperatorKind.PrefixDecrease, TypeSymbol.int),

    // Postfix
    new BoundUnaryOperator(SyntaxKind.PlusPlusToken, BoundUnaryOperatorKind.PostFixIncrease, TypeSymbol.int, TypeSymbol.int, true),
    new BoundUnaryOperator(SyntaxKind.MinusMinusToken, BoundUnaryOperatorKind.PostFixDecrease, TypeSymbol.int, TypeSymbol.int, true),

    // a?.test(), the question mark
    new BoundUnaryOperator(SyntaxKind.QuestionToken, BoundUnaryOperatorKind.Optional, TypeSymbol.Object, TypeSymbol.self, true),

    new BoundUnaryOperator(SyntaxKind.NewKeyword, BoundUnaryOperatorKind.New, TypeSymbol.any),
  ]

  static bind(syntaxKind: SyntaxKind, opType: TypeSymbol, post: boolean = false) {
    for (const op of this.operator) {
      if (op.syntaxKind === syntaxKind && isType(opType, op.opType) && post === op.post) {
        return op;
      }
    }
  }
}