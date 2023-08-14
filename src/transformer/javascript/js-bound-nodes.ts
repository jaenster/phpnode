import {SyntaxToken} from "../../source/lexer.js";

export enum JsSyntaxKind {
  EOF,

  // Operators
  Addition,
  MemberAccess,
  StaticMemberAccess,
  Nullish,
  Subtraction,
  Multiplication,
  Expo,
  Division,
  LogicalAnd,
  LogicalOr,
  Equals,
  NotEquals,
  StrictEqual,
  StrictNotEqual,
  Less,
  LessEqual,
  Greater,
  GreaterEqual,
  BitwiseAnd,
  BitwiseOr,
  BitwiseXor,
  New,

  // Special tokens
  ParenOpen,
  ParenClose,
  BraceOpen,
  BraceClose,
  SquareOpen,
  SquareClose,

  // keywords / reserved words
  Arguments,
  Await,
  Boolean,
  Break,
  Case,
  Catch,
  Class,
  Const,
  Continue,
  Debugger,
  Default,
  Delete,
  Do,
  Else,
  Eval,
  Export,
  Extends,
  False,
  Finally,
  For,
  Function,
  If,
  Implements,
  Import,
  In,
  Instanceof,
  Let,
  Native,
  Null,
  Package,
  Private,
  Protected,
  Public,
  Return,
  Short,
  Static,
  Super,
  Switch,
  This,
  Throw,
  True,
  Try,
  Typeof,
  Var,
  Void,
  While,
  With,
  Yield,
}


type JsNode = (
  | JsNodeAddition | JsNodeMemberAccess | JsNodeStaticMemberAccess | JsNodeNullish | JsNodeSubtraction
  | JsNodeMultiplication | JsNodeExpo | JsNodeDivision | JsNodeLogicalAnd | JsNodeLogicalOr | JsNodeEquals
  | JsNodeNotEquals | JsNodeStrictEqual | JsNodeStrictNotEqual | JsNodeLess | JsNodeLessEqual | JsNodeGreater
  | JsNodeGreaterEqual | JsNodeBitwiseAnd | JsNodeBitwiseOr | JsNodeBitwiseXor | JsNodeNew | JsNodeParenOpen
  | JsNodeParenClose | JsNodeBraceOpen | JsNodeBraceClose | JsNodeSquareOpen | JsNodeSquareClose | JsNodeArguments
  | JsNodeAwait | JsNodeBoolean | JsNodeBreak | JsNodeCase | JsNodeCatch | JsNodeClass | JsNodeConst | JsNodeContinue
  | JsNodeDebugger | JsNodeDefault | JsNodeDelete | JsNodeDo | JsNodeElse | JsNodeEval | JsNodeExport | JsNodeExtends
  | JsNodeFalse | JsNodeFinally | JsNodeFor | JsNodeFunction | JsNodeIf | JsNodeImplements | JsNodeImport | JsNodeIn
  | JsNodeInstanceof | JsNodeLet | JsNodeNative | JsNodeNull | JsNodePackage | JsNodePrivate | JsNodeProtected
  | JsNodePublic | JsNodeReturn | JsNodeShort | JsNodeStatic | JsNodeSuper | JsNodeSwitch | JsNodeThis | JsNodeThrow
  | JsNodeTrue | JsNodeTry | JsNodeTypeof | JsNodeVar | JsNodeVoid | JsNodeWhile | JsNodeWith | JsNodeYield
  ) & { tokens: SyntaxToken[] }
  ;

type JsNodeAddition = { kind: JsSyntaxKind.Addition };
type JsNodeMemberAccess = { kind: JsSyntaxKind.MemberAccess };
type JsNodeStaticMemberAccess = { kind: JsSyntaxKind.StaticMemberAccess };
type JsNodeNullish = { kind: JsSyntaxKind.Nullish };
type JsNodeSubtraction = { kind: JsSyntaxKind.Subtraction };
type JsNodeMultiplication = { kind: JsSyntaxKind.Multiplication };
type JsNodeExpo = { kind: JsSyntaxKind.Expo };
type JsNodeDivision = { kind: JsSyntaxKind.Division };
type JsNodeLogicalAnd = { kind: JsSyntaxKind.LogicalAnd };
type JsNodeLogicalOr = { kind: JsSyntaxKind.LogicalOr };
type JsNodeEquals = { kind: JsSyntaxKind.Equals };
type JsNodeNotEquals = { kind: JsSyntaxKind.NotEquals };
type JsNodeStrictEqual = { kind: JsSyntaxKind.StrictEqual };
type JsNodeStrictNotEqual = { kind: JsSyntaxKind.StrictNotEqual };
type JsNodeLess = { kind: JsSyntaxKind.Less };
type JsNodeLessEqual = { kind: JsSyntaxKind.LessEqual };
type JsNodeGreater = { kind: JsSyntaxKind.Greater };
type JsNodeGreaterEqual = { kind: JsSyntaxKind.GreaterEqual };
type JsNodeBitwiseAnd = { kind: JsSyntaxKind.BitwiseAnd };
type JsNodeBitwiseOr = { kind: JsSyntaxKind.BitwiseOr };
type JsNodeBitwiseXor = { kind: JsSyntaxKind.BitwiseXor };
type JsNodeNew = { kind: JsSyntaxKind.New };
type JsNodeParenOpen = { kind: JsSyntaxKind.ParenOpen };
type JsNodeParenClose = { kind: JsSyntaxKind.ParenClose };
type JsNodeBraceOpen = { kind: JsSyntaxKind.BraceOpen };
type JsNodeBraceClose = { kind: JsSyntaxKind.BraceClose };
type JsNodeSquareOpen = { kind: JsSyntaxKind.SquareOpen };
type JsNodeSquareClose = { kind: JsSyntaxKind.SquareClose };
type JsNodeArguments = { kind: JsSyntaxKind.Arguments };
type JsNodeAwait = { kind: JsSyntaxKind.Await };
type JsNodeBoolean = { kind: JsSyntaxKind.Boolean };
type JsNodeBreak = { kind: JsSyntaxKind.Break };
type JsNodeCase = { kind: JsSyntaxKind.Case };
type JsNodeCatch = { kind: JsSyntaxKind.Catch };
type JsNodeClass = { kind: JsSyntaxKind.Class };
type JsNodeConst = { kind: JsSyntaxKind.Const };
type JsNodeContinue = { kind: JsSyntaxKind.Continue };
type JsNodeDebugger = { kind: JsSyntaxKind.Debugger };
type JsNodeDefault = { kind: JsSyntaxKind.Default };
type JsNodeDelete = { kind: JsSyntaxKind.Delete };
type JsNodeDo = { kind: JsSyntaxKind.Do };
type JsNodeElse = { kind: JsSyntaxKind.Else };
type JsNodeEval = { kind: JsSyntaxKind.Eval };
type JsNodeExport = { kind: JsSyntaxKind.Export };
type JsNodeExtends = { kind: JsSyntaxKind.Extends };
type JsNodeFalse = { kind: JsSyntaxKind.False };
type JsNodeFinally = { kind: JsSyntaxKind.Finally };
type JsNodeFor = { kind: JsSyntaxKind.For };
type JsNodeFunction = { kind: JsSyntaxKind.Function };
type JsNodeIf = { kind: JsSyntaxKind.If };
type JsNodeImplements = { kind: JsSyntaxKind.Implements };
type JsNodeImport = { kind: JsSyntaxKind.Import };
type JsNodeIn = { kind: JsSyntaxKind.In };
type JsNodeInstanceof = { kind: JsSyntaxKind.Instanceof };
type JsNodeLet = { kind: JsSyntaxKind.Let };
type JsNodeNative = { kind: JsSyntaxKind.Native };
type JsNodeNull = { kind: JsSyntaxKind.Null };
type JsNodePackage = { kind: JsSyntaxKind.Package };
type JsNodePrivate = { kind: JsSyntaxKind.Private };
type JsNodeProtected = { kind: JsSyntaxKind.Protected };
type JsNodePublic = { kind: JsSyntaxKind.Public };
type JsNodeReturn = { kind: JsSyntaxKind.Return };
type JsNodeShort = { kind: JsSyntaxKind.Short };
type JsNodeStatic = { kind: JsSyntaxKind.Static };
type JsNodeSuper = { kind: JsSyntaxKind.Super };
type JsNodeSwitch = { kind: JsSyntaxKind.Switch };
type JsNodeThis = { kind: JsSyntaxKind.This };
type JsNodeThrow = { kind: JsSyntaxKind.Throw };
type JsNodeTrue = { kind: JsSyntaxKind.True };
type JsNodeTry = { kind: JsSyntaxKind.Try };
type JsNodeTypeof = { kind: JsSyntaxKind.Typeof };
type JsNodeVar = { kind: JsSyntaxKind.Var };
type JsNodeVoid = { kind: JsSyntaxKind.Void };
type JsNodeWhile = { kind: JsSyntaxKind.While };
type JsNodeWith = { kind: JsSyntaxKind.With };
type JsNodeYield = { kind: JsSyntaxKind.Yield };
