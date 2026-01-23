import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  DbGenerationRangeResolver,
  GenerationRangeResolver,
  IngestionRunRepository,
  PokedexUpsertRepository
} from '../../domain';
import { SyncPokedexGenerationCommand } from '../commands';
import { PokeApiClient } from 'src/ingestion/infrastructure';
import { GENERATION_TOKENS, GenerationRepository } from 'src/shared/generation';

@Injectable()
export class SyncPokedexGenerationHandler {
  private readonly resolver: GenerationRangeResolver;

  constructor(
    @Inject('IngestionRunRepository') private readonly runs: IngestionRunRepository,
    @Inject('PokedexUpsertRepository') private readonly upserts: PokedexUpsertRepository,
    @Inject(GENERATION_TOKENS.Repository) private readonly generations: GenerationRepository,
    private readonly pokeApi: PokeApiClient
  ) {
    this.resolver = new DbGenerationRangeResolver(this.generations);
  }

  async execute(cmd: SyncPokedexGenerationCommand) {
    let range;
    try {
      range = await this.resolver.resolve(cmd.generation);
    } catch (e: any) {
      throw new BadRequestException(e?.message ?? 'Invalid generation');
    }

    const run = await this.runs.startRun({
      source: 'pokeapi',
      generation: cmd.generation.value,
      itemsTotal: range.size()
    });

    let ok = 0;
    let fail = 0;

    for (let dexId = range.from; dexId <= range.to; dexId++) {
      try {
        const p = await this.pokeApi.getPokemon(dexId);
        await this.upserts.upsertPokemon(p);
        ok++;
      } catch (e: any) {
        fail++;
        await this.runs.addError(run.id, {
          entity: 'pokemon',
          entityKey: String(dexId),
          message: e?.message ?? 'unknown error'
        });
      }

      // progress every 10
      if ((dexId - range.from + 1) % 10 === 0) {
        await this.runs.markProgress(run.id, { itemsSuccess: ok, itemsFailed: fail });
      }
    }

    const status = fail === 0 ? 'SUCCESS' : 'FAILED';
    return this.runs.finishRun(run.id, { status, itemsSuccess: ok, itemsFailed: fail });
  }
}
