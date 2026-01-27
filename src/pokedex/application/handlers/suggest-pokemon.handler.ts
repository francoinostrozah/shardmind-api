import { Inject, Injectable } from '@nestjs/common';
import { PokemonRepository } from '../../domain';
import { SuggestPokemonQuery } from '../queries';

@Injectable()
export class SuggestPokemonHandler {
  constructor(@Inject('PokemonRepository') private readonly repo: PokemonRepository) {}

  async execute(query: SuggestPokemonQuery) {
    const q = (query.input.q ?? '').trim();
    if (!q) return [];

    const limit = Math.min(Math.max(query.input.limit ?? 10, 1), 20);

    return this.repo.suggestByName({
      q,
      limit,
      minScore: 0.25
    });
  }
}
