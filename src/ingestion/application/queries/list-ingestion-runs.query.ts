export class ListIngestionRunsQuery {
  constructor(public readonly input: { limit: number; offset: number }) {}
}
