import { GenerationRepository } from 'src/shared/generation';
import { DexRange, Generation } from '../value-objects';

export interface GenerationRangeResolver {
  resolve(gen: Generation): Promise<DexRange>;
}

/**
 * Default resolver (static mapping).
 * Scalable: later we can move it to a database table or an official data source.
 */
export class DbGenerationRangeResolver implements GenerationRangeResolver {
  constructor(private readonly generations: GenerationRepository) {}

  async resolve(gen: Generation): Promise<DexRange> {
    const g = await this.generations.findById(gen.value);
    if (!g) throw new Error(`Unsupported generation: ${gen.value}`);
    return DexRange.of(g.dexFrom, g.dexTo);
  }
}
