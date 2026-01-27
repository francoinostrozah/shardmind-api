export class SuggestPokemonQuery {
  constructor(public readonly input: { q: string; limit: number }) {}
}
