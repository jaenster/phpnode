import type {BoundExpression} from "./bound-expression.js";
import type {BoundFile, BoundSpecial} from "./bound-special.js";
import {BoundBinaryOperatorKind, BoundUnaryOperatorKind} from "./bound-operator.js";
import type {BoundStatement} from "./bound-statement.js";

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

  // Doesn't exist's in the syntax, this is not a (foo). Simply abusing this to wrap __php_use calls in parens
  BoundParenExpression,

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

export type BoundNodeTypes = (BoundExpression | BoundStatement | BoundSpecial) & { parent?: BoundNodeTypes };

export function createBoundExpression<T extends BoundExpression>(value: BoundNodeTypes): T & BoundNode {
  const instance = new BoundNode() as BoundNode&T;
  Object.assign(instance, value, {fields: Object.keys(value)}, {debugKindName: BoundKind[value.kind]});
  wrapParent(instance)
  return instance;
}

export function createBoundStatement<T extends BoundStatement>(value: BoundNodeTypes): T & BoundNode {
  const instance = new BoundNode() as BoundNode&T;
  Object.assign(instance, value, {fields: Object.keys(value)}, {debugKindName: BoundKind[value.kind]});
  wrapParent(instance)
  return instance;
}

export function createBoundSpecial<T extends BoundSpecial>(value: BoundNodeTypes): T & BoundNode {
  const instance = new BoundNode() as BoundNode&T;
  Object.assign(instance, value, {fields: Object.keys(value)}, {debugKindName: BoundKind[value.kind]});
  wrapParent(instance)
  return instance;
}

function wrapParent(parent: { parent: BoundNodeTypes } & BoundNodeTypes) {
  switch (parent.kind) {
    case BoundKind.BoundVariableExpression:
    case BoundKind.BoundSemiColonStatement:
    case BoundKind.BoundEmptyExpression:
    case BoundKind.BoundErrorExpression:
    case BoundKind.BoundNameExpression:
    case BoundKind.BoundLiteralExpression:
    case BoundKind.BoundBreakStatement:
    case BoundKind.BoundContinueStatement:
    case BoundKind.BoundJumpStatement:
    case BoundKind.BoundPropertyStatement:
    case BoundKind.BoundLabelStatement:
    case BoundKind.BoundVariableStatement:
    case BoundKind.BoundParameter:
    case BoundKind.BoundElse:
    case BoundKind.BoundLabel:
      break;
    case BoundKind.BoundReturnStatement:
      if (parent.expression) parent.expression.parent = parent
      break;
    case BoundKind.BoundParenExpression:
    case BoundKind.BoundAssignmentExpression:
    case BoundKind.BoundExpressionStatement:
    case BoundKind.BoundEchoStatement:
      parent.expression.parent = parent;
      break;
    case BoundKind.BoundBinaryExpression:
      parent.left.parent = parent;
      parent.right.parent = parent;
      break;
    case BoundKind.BoundCommaExpression:
      parent.expressions.forEach(child => child.parent = parent);
      break;
    case BoundKind.BoundUnaryExpression:
      parent.operand.parent = parent;
      break;
    case BoundKind.BoundClassStatement:
      [...parent.methods, ...parent.properties].forEach((node: BoundNodeTypes) => node.parent = node)
      break;
    case BoundKind.BoundMethodStatement:
    case BoundKind.BoundFunctionStatement:
    case BoundKind.BoundFile:
    case BoundKind.BoundBlockStatement:
      parent.statements.forEach((child: BoundNodeTypes) => child.parent = parent);
      break;
    case BoundKind.BoundBodyStatement:
      parent.statement.parent = parent;
      break;
    case BoundKind.BoundForStatement:
      (parent.init as BoundNodeTypes).parent = parent;
      parent.condition.parent = parent;
      parent.afterthought.parent = parent;
      (parent.body as BoundNodeTypes).parent = parent;
      break;
    case BoundKind.BoundIfStatement:
    case BoundKind.BoundJumpConditionalStatement:
    case BoundKind.BoundWhileStatement:
      parent.condition.parent = parent;
      break;
  }
}

export class BoundNode {
  public readonly kind: BoundKind;

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


  #parent: WeakRef<BoundNode & BoundNodeTypes>
  set parent(v: BoundNode & BoundNodeTypes) {
    this.#parent = v ? new WeakRef(v) : undefined;
  }
  get parent() {
    return this.#parent?.deref();
  }

  static clone(parent: BoundNode) {

    const clone = new BoundNode();
    parent.fields.forEach(key => clone[key] === parent[key]);
    Object.assign(clone, {fields: [...parent.fields], kind: parent.kind}, {debugKindName: BoundKind[parent.kind]});

    for (const field of parent.fields) {
      if (field === 'kind') continue;
      const node = clone[field] as unknown as BoundNode;
      if (node instanceof BoundNode) {
        clone[field as string] = BoundNode.clone(node);
      } else if (Array.isArray(node)) {
        clone[field as string] = (node as BoundNode[]).map(child => BoundNode.clone(child))
      }
    }
    return clone;
  }

  static* flat(statement: (BoundStatement | BoundFile) | Array<BoundStatement | BoundFile>): Generator<BoundStatement> {
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

  static* flatExpression(expression: (BoundExpression) | Array<BoundExpression>) {
    if (Array.isArray(expression)) {
      for (const child of expression) {
        yield* this.flatExpression(child);
      }
    } else {
      switch (expression.kind) {
        case BoundKind.BoundEmptyExpression:
        case BoundKind.BoundVariableExpression:
        case BoundKind.BoundLiteralExpression:
        case BoundKind.BoundNameExpression:
          yield expression
          break;
        case BoundKind.BoundAssignmentExpression:
          yield expression;
          yield expression.expression;
          break;
        case BoundKind.BoundBinaryExpression:
          yield expression
          yield* this.flatExpression(expression.left)
          yield* this.flatExpression(expression.right)
          break;

        case BoundKind.BoundCommaExpression:
          yield expression
          yield* this.flatExpression(expression.expressions);
          break;
        case BoundKind.BoundUnaryExpression:
          yield expression
          yield* this.flatExpression(expression.operand)
          break;

        // Those start a new scope; So its not part of this expressions
        case BoundKind.BoundClassStatement:
          break;
        case BoundKind.BoundFunctionStatement:
          break;
      }
    }
  }
}
