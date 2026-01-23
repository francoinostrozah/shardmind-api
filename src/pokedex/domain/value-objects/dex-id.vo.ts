export class DexId {
  private constructor(public readonly value: number) {}

  static of(value: number): DexId {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error('DexId must be a positive integer');
    }
    return new DexId(value);
  }
}
