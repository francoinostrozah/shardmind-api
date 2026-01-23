import { BadRequestException, Controller, Post, Query } from '@nestjs/common';
import { SyncPokedexGenerationHandler } from '../application';
import { Generation } from '../domain';
import { SyncPokedexGenerationCommand } from '../application/commands';

@Controller('v1/admin/ingestion/pokedex')
export class IngestionController {
  constructor(private readonly syncGen: SyncPokedexGenerationHandler) {}

  @Post('sync')
  sync(@Query('generation') generation?: string) {
    const n = Number(generation);
    if (!generation || !Number.isInteger(n)) {
      throw new BadRequestException('generation must be an integer');
    }

    return this.syncGen.execute(new SyncPokedexGenerationCommand(Generation.of(n)));
  }
}
