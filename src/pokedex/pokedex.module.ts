import { Module } from '@nestjs/common';
import { PokedexController } from './presentation';
import { PokemonPrismaRepository } from './infrastructure';
import { BrowsePokedexHandler, LookupPokemonByDexIdHandler, LookupPokemonByNameHandler } from './application';

@Module({
  controllers: [PokedexController],
  providers: [
    // handlers (use-cases)
    BrowsePokedexHandler,
    LookupPokemonByDexIdHandler,
    LookupPokemonByNameHandler,

    // infra repos
    PokemonPrismaRepository,

    // repository adapter + token binding
    PokemonPrismaRepository,
    { provide: 'PokemonRepository', useExisting: PokemonPrismaRepository }
  ]
})
export class PokedexModule {}
