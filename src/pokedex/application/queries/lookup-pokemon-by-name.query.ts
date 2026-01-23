import { PokemonName } from '../../domain';

export class LookupPokemonByNameQuery {
  constructor(public readonly name: PokemonName) {}
}
