import { Module } from '@nestjs/common';
import { IngestionController } from './presentation';
import { SyncPokedexGenerationHandler } from './application';
import { PokeApiClient } from './infrastructure/pokeapi';
import { IngestionRunPrismaRepository, PokedexUpsertPrismaRepository } from './infrastructure/prisma';

@Module({
  controllers: [IngestionController],
  providers: [
    // app
    SyncPokedexGenerationHandler,

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
