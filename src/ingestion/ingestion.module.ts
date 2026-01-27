import { Module } from '@nestjs/common';
import { IngestionController, IngestionObservabilityController } from './presentation';
import { ListIngestionRunErrorsHandler, ListIngestionRunsHandler, SyncPokedexGenerationHandler } from './application';
import { PokeApiClient } from './infrastructure/pokeapi';
import { IngestionRunPrismaRepository, PokedexUpsertPrismaRepository } from './infrastructure/prisma';

@Module({
  controllers: [IngestionController, IngestionObservabilityController],
  providers: [
    // commands
    SyncPokedexGenerationHandler,

    // queries (observability)
    ListIngestionRunsHandler,
    ListIngestionRunErrorsHandler,

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
