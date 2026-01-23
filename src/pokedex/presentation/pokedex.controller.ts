import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  BrowsePokedexQueryDto,
  BrowsePokedexQuery,
  LookupPokemonByDexIdQuery,
  LookupPokemonByNameQuery
} from '../application';
import { BrowsePokedexHandler, LookupPokemonByDexIdHandler, LookupPokemonByNameHandler } from '../application';
import { DexId, PokemonName } from '../domain';

@Controller('v1/pokemon')
export class PokedexController {
  constructor(
    private readonly browse: BrowsePokedexHandler,
    private readonly byDex: LookupPokemonByDexIdHandler,
    private readonly byName: LookupPokemonByNameHandler
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
        offset: q.offset ?? 0
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
}
