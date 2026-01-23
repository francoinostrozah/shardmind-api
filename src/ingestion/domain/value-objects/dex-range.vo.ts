export class DexRange {
  private constructor(
    public readonly from: number,
    public readonly to: number
  ) {}

  static of(from: number, to: number): DexRange {
    if (!Number.isInteger(from) || !Number.isInteger(to) || from <= 0 || to <= 0) {
      throw new Error('DexRange must be positive integers');
    }
    if (from > to) throw new Error('DexRange.from must be <= DexRange.to');
    return new DexRange(from, to);
  }

  size(): number {
    return this.to - this.from + 1;
  }
}
