export type PokedexPokemonUpsert = {
  dexId: number;
  name: string;
  height: number | null;
  weight: number | null;
  baseExperience: number | null;
  spriteDefault: string | null;

  types: { id: number; name: string; slot: number }[];
  stats: { id: number; name: string; baseValue: number; effort: number }[];
  abilities: { id: number; name: string; slot: number; isHidden: boolean }[];
};

export interface PokedexUpsertRepository {
  upsertPokemon(data: PokedexPokemonUpsert): Promise<void>;
}
