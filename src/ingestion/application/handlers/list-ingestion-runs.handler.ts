import { Inject, Injectable } from '@nestjs/common';
import { IngestionRunRepository } from '../../domain';
import { ListIngestionRunsQuery } from '../queries';

@Injectable()
export class ListIngestionRunsHandler {
  constructor(@Inject('IngestionRunRepository') private readonly runs: IngestionRunRepository) {}

  execute(query: ListIngestionRunsQuery) {
    const limit = Math.min(Math.max(query.input.limit ?? 20, 1), 200);
    const offset = Math.max(query.input.offset ?? 0, 0);

    // Use repository read-side for observability
    return this.runs.listRuns({ limit, offset });
  }
}
