import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  BrowsePokedexQueryDto,
  BrowsePokedexQuery,
  LookupPokemonByDexIdQuery,
  LookupPokemonByNameQuery,
  SuggestPokemonHandler,
  SuggestPokemonQueryDto,
  SuggestPokemonQuery,
  FindSimilarPokemonQuery,
  FindSimilarPokemonHandler,
  FindSimilarQueryDto
} from '../application';
import { BrowsePokedexHandler, LookupPokemonByDexIdHandler, LookupPokemonByNameHandler } from '../application';
import { DexId, PokemonName } from '../domain';

@Controller('v1/pokemon')
export class PokedexController {
  constructor(
    private readonly browse: BrowsePokedexHandler,
    private readonly byDex: LookupPokemonByDexIdHandler,
    private readonly byName: LookupPokemonByNameHandler,
    private readonly suggest: SuggestPokemonHandler,
    private readonly findSimilar: FindSimilarPokemonHandler
  ) {}

  @Get()
  list(@Query() q: BrowsePokedexQueryDto) {
    return this.browse.execute(
      new BrowsePokedexQuery({
        q: q.q,
        type: q.type,
        generation: q.generation,
        dexFrom: q.dexFrom,
        dexTo: q.dexTo,
        limit: q.limit ?? 20,
        offset: q.offset ?? 0,
        cursor: q.cursor,
        sort: q.sort,
        direction: q.direction
      })
    );
  }

  @Get('suggest')
  suggestNames(@Query() q: SuggestPokemonQueryDto) {
    return this.suggest.execute(
      new SuggestPokemonQuery({
        q: q.q,
        limit: q.limit ?? 10
      })
    );
  }

  @Get(':idOrName')
  get(@Param('idOrName') idOrName: string) {
    const trimmed = (idOrName ?? '').trim().toLowerCase();
    const asNumber = Number(trimmed);
    const isDexId = Number.isInteger(asNumber) && String(asNumber) === trimmed;

    return isDexId
      ? this.byDex.execute(new LookupPokemonByDexIdQuery(DexId.of(asNumber)))
      : this.byName.execute(new LookupPokemonByNameQuery(PokemonName.of(trimmed)));
  }

  @Get(':dexId/similar')
  similar(@Param('dexId') dexId: string, @Query() q: FindSimilarQueryDto) {
    const id = Number(dexId);

    return this.findSimilar.execute(
      new FindSimilarPokemonQuery({
        dexId: id,
        limit: q.limit ?? 10
      })
    );
  }
}
