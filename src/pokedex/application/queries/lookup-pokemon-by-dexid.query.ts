import { DexId } from '../../domain';

export class LookupPokemonByDexIdQuery {
  constructor(public readonly dexId: DexId) {}
}
