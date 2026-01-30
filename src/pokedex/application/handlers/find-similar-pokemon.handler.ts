import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PokemonRepository } from '../../domain';
import { FindSimilarPokemonQuery } from '../queries';

@Injectable()
export class FindSimilarPokemonHandler {
  constructor(@Inject('PokemonRepository') private readonly repo: PokemonRepository) {}

  async execute(query: FindSimilarPokemonQuery) {
    const dexId = query.input.dexId;
    const limit = Math.min(Math.max(query.input.limit ?? 10, 1), 50);

    // Ensure the base Pokémon exists (optional but nice)
    // If you already have a lightweight exists check, use it; otherwise call detail.
    const base = await this.repo.findByDexId({ value: dexId } as any);
    if (!base) throw new NotFoundException(`Pokemon ${dexId} not found`);

    return this.repo.findSimilarByDexId({ dexId, limit });
  }
}
