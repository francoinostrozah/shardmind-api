import { Controller, Get, Param, Query } from '@nestjs/common';
import { ListIngestionRunsHandler, ListIngestionRunErrorsHandler } from '../application/handlers';
import { ListIngestionRunsQueryDto, ListIngestionRunErrorsQueryDto } from '../application/dto';
import { ListIngestionRunsQuery, ListIngestionRunErrorsQuery } from '../application/queries';

@Controller('v1/admin/ingestion')
export class IngestionObservabilityController {
  constructor(
    private readonly listRuns: ListIngestionRunsHandler,
    private readonly listErrors: ListIngestionRunErrorsHandler
  ) {}

  @Get('runs')
  runs(@Query() q: ListIngestionRunsQueryDto) {
    return this.listRuns.execute(
      new ListIngestionRunsQuery({
        limit: q.limit ?? 20,
        offset: q.offset ?? 0
      })
    );
  }

  @Get('runs/:id/errors')
  errors(@Param('id') id: string, @Query() q: ListIngestionRunErrorsQueryDto) {
    return this.listErrors.execute(
      new ListIngestionRunErrorsQuery({
        runId: id,
        limit: q.limit ?? 50,
        offset: q.offset ?? 0
      })
    );
  }
}
