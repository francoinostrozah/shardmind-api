import { Module } from '@nestjs/common';
import { IngestionController, IngestionMaintenanceController, IngestionObservabilityController } from './presentation';
import {
  BackfillPokemonStatsVectorHandler,
  ListIngestionRunErrorsHandler,
  ListIngestionRunsHandler,
  SyncPokedexGenerationHandler
} from './application';
import { PokeApiClient } from './infrastructure/pokeapi';
import { IngestionRunPrismaRepository, PokedexUpsertPrismaRepository } from './infrastructure/prisma';

@Module({
  controllers: [IngestionController, IngestionObservabilityController, IngestionMaintenanceController],
  providers: [
    // commands
    SyncPokedexGenerationHandler,

    // queries (observability)
    ListIngestionRunsHandler,
    ListIngestionRunErrorsHandler,
    BackfillPokemonStatsVectorHandler,

    // infra
    PokeApiClient,
    IngestionRunPrismaRepository,
    PokedexUpsertPrismaRepository,

    // ports bindings
    { provide: 'IngestionRunRepository', useExisting: IngestionRunPrismaRepository },
    { provide: 'PokedexUpsertRepository', useExisting: PokedexUpsertPrismaRepository }
  ]
})
export class IngestionModule {}
