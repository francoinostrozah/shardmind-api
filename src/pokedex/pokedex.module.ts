import { Module } from '@nestjs/common';
import { GenerationsController, PokedexController } from './presentation';
import { PokemonPrismaRepository } from './infrastructure';
import {
  BrowsePokedexHandler,
  FindSimilarPokemonHandler,
  LookupPokemonByDexIdHandler,
  LookupPokemonByNameHandler,
  SuggestPokemonHandler
} from './application';

@Module({
  controllers: [PokedexController, GenerationsController],
  providers: [
    // handlers (use-cases)
    BrowsePokedexHandler,
    LookupPokemonByDexIdHandler,
    LookupPokemonByNameHandler,
    SuggestPokemonHandler,
    FindSimilarPokemonHandler,

    // infra repos
    PokemonPrismaRepository,

    // repository adapter + token binding
    PokemonPrismaRepository,
    { provide: 'PokemonRepository', useExisting: PokemonPrismaRepository }
  ]
})
export class PokedexModule {}
