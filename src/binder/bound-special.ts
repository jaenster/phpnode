import {VariableSymbol} from "../symbols/symbols.js";
import {BoundKind} from "./bound.node.js";
import {BoundStatement} from "./bound-statement.js";

export type BoundSpecial =
  | BoundElse
  | BoundLabel
  | BoundFile
  | BoundParameter


export type BoundLabel = {
  kind: BoundKind.BoundLabel,
  name: string,
}

export type BoundParameter = {
  kind: BoundKind.BoundParameter
  variable: VariableSymbol,
}

export type BoundElse = {
  kind: BoundKind.BoundElse
  name: VariableSymbol,
}

export type BoundFile = {
  kind: BoundKind.BoundFile,
  statements: BoundStatement[],
  filename: string,
}