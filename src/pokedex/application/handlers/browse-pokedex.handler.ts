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

    // Sorting defaults
    const sort = c.sort ?? 'dexId';
    const direction = c.direction ?? 'asc';

    // Resolve generation into dex range (Single Source of Truth: DB)
    let dexFrom = c.dexFrom;
    let dexTo = c.dexTo;

    if (c.generation) {
      const g = await this.generations.findById(c.generation);

      if (!g) throw new BadRequestException(`Unsupported generation: ${c.generation}`);

      dexFrom = g.dexFrom;
      dexTo = g.dexTo;
    }

    // Cursor pagination is only supported for dexId sort
    const cursor = sort === 'dexId' ? c.cursor : undefined;

    const result = await this.repo.browse({
      ...c,
      q: c.q?.trim() ? c.q.trim().toLowerCase() : undefined,
      type: c.type?.trim() ? c.type.trim().toLowerCase() : undefined,
      dexFrom,
      dexTo,
      limit,
      offset,
      cursor,
      sort,
      direction
    });

    const last = result.items.length ? result.items[result.items.length - 1] : null;

    return {
      ...result,
      nextCursor: sort === 'dexId' && last ? last.dexId : null,
      pagination: {
        mode: cursor ? 'cursor' : 'offset',
        sort,
        direction
      }
    };
  }
}
