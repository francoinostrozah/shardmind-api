import { Inject, Injectable } from '@nestjs/common';
import { IngestionRunRepository } from '../../domain';
import { ListIngestionRunErrorsQuery } from '../queries';

@Injectable()
export class ListIngestionRunErrorsHandler {
  constructor(@Inject('IngestionRunRepository') private readonly runs: IngestionRunRepository) {}

  execute(query: ListIngestionRunErrorsQuery) {
    const limit = Math.min(Math.max(query.input.limit ?? 50, 1), 200);
    const offset = Math.max(query.input.offset ?? 0, 0);

    // Use repository read-side for observability
    return this.runs.listRunErrors({
      runId: query.input.runId,
      limit,
      offset
    });
  }
}
