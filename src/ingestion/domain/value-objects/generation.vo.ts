export class Generation {
  private constructor(public readonly value: number) {}

  static of(value: number): Generation {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error('Generation must be a positive integer');
    }
    return new Generation(value);
  }
}
