import { Controller, Post, Query } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { BackfillPokemonStatsVectorHandler } from '../application/handlers/backfill-pokemon-stats-vector.handler';

class BackfillStatsVectorQueryDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(50)
  @Max(2000)
  batchSize?: number;
}

@Controller('v1/admin/ingestion')
export class IngestionMaintenanceController {
  constructor(private readonly backfill: BackfillPokemonStatsVectorHandler) {}

  @Post('pokedex/backfill-stats-vector')
  run(@Query() q: BackfillStatsVectorQueryDto) {
    return this.backfill.execute({ batchSize: q.batchSize });
  }
}
