import {SyntaxToken} from "../source/lexer.js";
import {SyntaxKind} from "../source/syntax/syntax.kind.js";

export enum BoundModifiers {
  Abstract            = 1 << 0,
  Final           = 1 << 1,
  Private           = 1 << 2,
  Protected           = 1 << 3,
  Public            = 1 << 4,
  Readonly            = 1 << 5,
  Static            = 1 << 6,

  None = 0,

  AllowedInClass = Abstract | Final,
  AllowedOnMethod = Abstract | Final | Public | Protected | Private | Static,
  AllowedOnProperty = Static | Readonly | Public | Private | Protected ,
}

export const ModifiersCollides = [
  BoundModifiers.Public | BoundModifiers.Protected | BoundModifiers.Private,
  BoundModifiers.Final | BoundModifiers.Abstract
]

export const ModifierMapping = {
  [SyntaxKind.AbstractKeyword]: BoundModifiers.Abstract ,
  [SyntaxKind.FinalKeyword]: BoundModifiers.Final ,
  [SyntaxKind.PrivateKeyword]: BoundModifiers.Private ,
  [SyntaxKind.ProtectedKeyword]: BoundModifiers.Protected ,
  [SyntaxKind.PublicKeyword]: BoundModifiers.Public ,
  [SyntaxKind.ReadonlyKeyword]: BoundModifiers.Readonly ,
  [SyntaxKind.StaticKeyword]: BoundModifiers.Static ,
}