import { DexId, PokemonName } from '../value-objects';
import { PokemonDetail, PokemonListItem } from '../models';

export type PokedexBrowseCriteria = {
  q?: string;
  type?: string;
  generation?: number;
  dexFrom?: number;
  dexTo?: number;
  limit: number;

  // Offset pagination (fallback)
  offset: number;

  // Cursor pagination (keyset). Only supported when sort = 'dexId'
  cursor?: number;

  // Sorting
  sort?: 'dexId' | 'name';
  direction?: 'asc' | 'desc';
};

export type PokemonNameSuggestion = {
  dexId: number;
  name: string;
  spriteDefault: string | null;
  score: number;
};

export type SimilarPokemonResult = {
  dexId: number;
  name: string;
  spriteDefault: string | null;
  score: number;
  sharedTypes: string[];
};

export interface PokemonRepository {
  browse(criteria: PokedexBrowseCriteria): Promise<{ total: number; items: PokemonListItem[] }>;
  findByDexId(dexId: DexId): Promise<PokemonDetail | null>;
  findByName(name: PokemonName): Promise<PokemonDetail | null>;
  suggestByName(input: { q: string; limit: number; minScore?: number }): Promise<PokemonNameSuggestion[]>;
  findSimilarByDexId(input: { dexId: number; limit: number }): Promise<SimilarPokemonResult[]>;
}
