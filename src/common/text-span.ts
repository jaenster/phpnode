export class TextSpan {

  constructor(
    public readonly start: number,
    public readonly end: number,
  ) {
  }

  static fromBounds(first: number, end: number) {
    return new TextSpan(first, end-first)
  }
}