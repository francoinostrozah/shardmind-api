import { Module } from '@nestjs/common';
import { PrismaModule } from './shared/prisma';
import { PokedexModule } from './pokedex';
import { IngestionModule } from './ingestion';
import { ConfigModule } from '@nestjs/config';
import { GenerationModule } from './shared/generation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
    PrismaModule,
    GenerationModule,
    PokedexModule,
    IngestionModule
  ]
})
export class AppModule {}
