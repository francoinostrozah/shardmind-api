import { DexId, PokemonName } from '../value-objects';
import { PokemonDetail, PokemonListItem } from '../models';

export type PokedexBrowseCriteria = {
  q?: string;
  type?: string;
  generation?: number;
  dexFrom?: number;
  dexTo?: number;
  limit: number;
  offset: number;
};

export interface PokemonRepository {
  browse(criteria: PokedexBrowseCriteria): Promise<{ total: number; items: PokemonListItem[] }>;
  findByDexId(dexId: DexId): Promise<PokemonDetail | null>;
  findByName(name: PokemonName): Promise<PokemonDetail | null>;
}
