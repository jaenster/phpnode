import {BoundExpression} from "./bound-expression.js";
import {BoundFile, BoundSpecial} from "./bound-special.js";
import {BoundBinaryOperatorKind, BoundUnaryOperatorKind} from "./bound-operator.js";
import {BoundStatement} from "./bound-statement.js";

export enum BoundKind {
  // Expressions
  BoundErrorExpression,
  BoundNameExpression,
  BoundAssignmentExpression,
  BoundBinaryExpression,
  BoundCommaExpression,
  BoundLiteralExpression,
  BoundEmptyExpression,
  BoundUnaryExpression,
  BoundVariableExpression,

  // Special
  BoundLabel,
  BoundParameter,
  BoundElse,
  BoundFile,

  // Statements
  BoundBlockStatement,
  BoundBodyStatement,
  BoundBreakStatement,
  BoundContinueStatement,
  BoundExpressionStatement,
  BoundForStatement,
  BoundIfStatement,
  BoundJumpConditionalStatement,
  BoundJumpStatement,
  BoundLabelStatement,
  BoundReturnStatement,
  BoundSemiColonStatement,
  BoundVariableStatement,
  BoundWhileStatement,
  BoundEchoStatement,
  BoundFunctionStatement,
  BoundMethodStatement,
  BoundClassStatement,
  BoundPropertyStatement,
}

class Foo {
  foo;
}

export type BoundNodeTypes = BoundExpression | BoundStatement | BoundSpecial;

export function createBoundExpression<T extends BoundExpression>(value: BoundNodeTypes): T & BoundNode {
  const instance = Object.create(BoundNode.prototype);
  return Object.assign(instance, value, {fields: Object.keys(value)});
}

export function createBoundStatement<T extends BoundStatement>(value: BoundNodeTypes): T & BoundNode {
  const instance = Object.create(BoundNode.prototype);
  return Object.assign(instance, value, {fields: Object.keys(value)});
}

export function createBoundSpecial<T extends BoundSpecial>(value: BoundNodeTypes): T & BoundNode {
  const instance = Object.create(BoundNode.prototype);
  return Object.assign(instance, value, {fields: Object.keys(value)});
}

export class BoundNode {
  public readonly fields: (keyof this)[];

  prettyPrint(this: BoundNode & BoundNodeTypes, indent: string = '', isLast = true) {
    const getText = () => {
      switch (this.kind) {
        case BoundKind.BoundBinaryExpression:
          return BoundBinaryOperatorKind[this.operator.kind] + 'Expression';
        case BoundKind.BoundUnaryExpression:
          return BoundUnaryOperatorKind[this.operator.kind] + 'Expression';
      }

      return BoundKind[this.kind];
    };

    const text = [`${indent}${isLast ? "└──" : "├──"}${getText()}`];

    const accProp: string[] = [];
    for (const key of this.fields) {
      if (key === 'kind') continue;

      let toString: string;

      if (!this[key]) {
        continue
      }

      switch (true) {
        case Array.isArray(this[key]):
          toString = '{length: ' + this[key].length + '}';
          break;
        case this[key].toString !== Object.prototype.toString:
          toString = this[key].toString();
          break;
        default:
          continue;
      }

      accProp.push(`${key} = ${toString}`);
    }

    console.log(text + ' ' + accProp.join(', '));

    const children: BoundNode[] = (this.fields.map(el => this[el]).flat() as any).filter(el => el instanceof BoundNode);

    const last = children.slice(-1)[0];
    indent += isLast ? "   " : "│  ";
    for (const field of this.fields) {
      if (field === 'kind') continue;
      const node = this[field] as unknown as BoundNode & BoundNodeTypes;
      if (node instanceof BoundNode) {
        node.prettyPrint(indent, last === node);
      } else if (Array.isArray(node)) {
        for (const child of (node as any)) {
          child.prettyPrint(indent, last === child);
        }
      }
    }
  }

  static* flat(statement: (BoundStatement | BoundFile) | Array<BoundStatement | BoundFile>) {
    if (Array.isArray(statement)) {
      for (const child of statement) {
        yield* this.flat(child);
      }
    } else {
      switch (statement.kind) {
        case BoundKind.BoundBodyStatement:
          yield statement.statement
          break;
        case BoundKind.BoundFile:
        case BoundKind.BoundBlockStatement:
          yield* this.flat(statement.statements)
          break;
        case BoundKind.BoundSemiColonStatement:
        case BoundKind.BoundBreakStatement:
        case BoundKind.BoundContinueStatement:
        case BoundKind.BoundExpressionStatement:
        case BoundKind.BoundForStatement:
        case BoundKind.BoundReturnStatement:
        case BoundKind.BoundIfStatement:
        case BoundKind.BoundJumpConditionalStatement:
        case BoundKind.BoundJumpStatement:
        case BoundKind.BoundLabelStatement:
        case BoundKind.BoundVariableStatement:
        case BoundKind.BoundWhileStatement:
          yield statement
          break;
      }
    }
  }
}
