export class ListIngestionRunErrorsQuery {
  constructor(public readonly input: { runId: string; limit: number; offset: number }) {}
}
