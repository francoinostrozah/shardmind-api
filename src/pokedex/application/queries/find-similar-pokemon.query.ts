export class FindSimilarPokemonQuery {
  constructor(public readonly input: { dexId: number; limit: number }) {}
}
