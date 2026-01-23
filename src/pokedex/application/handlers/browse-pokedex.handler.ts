import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PokemonRepository } from '../../domain';
import { BrowsePokedexQuery } from '../queries';
import { GENERATION_TOKENS, GenerationRepository } from 'src/shared/generation';

@Injectable()
export class BrowsePokedexHandler {
  constructor(
    @Inject('PokemonRepository') private readonly repo: PokemonRepository,
    @Inject(GENERATION_TOKENS.Repository) private readonly generations: GenerationRepository
  ) {}

  async execute(query: BrowsePokedexQuery) {
    const c = query.criteria;
    const limit = Math.min(Math.max(c.limit, 1), 200);
    const offset = Math.max(c.offset, 0);

    let dexFrom = c.dexFrom;
    let dexTo = c.dexTo;

    if (c.generation) {
      const g = await this.generations.findById(c.generation);
      if (!g) throw new BadRequestException(`Unsupported generation: ${c.generation}`);
      dexFrom = g.dexFrom;
      dexTo = g.dexTo;
    }

    return this.repo.browse({
      ...c,
      limit,
      offset,
      dexFrom,
      dexTo,
      q: c.q?.trim() ? c.q.trim().toLowerCase() : undefined,
      type: c.type?.trim() ? c.type.trim().toLowerCase() : undefined
    });
  }
}
