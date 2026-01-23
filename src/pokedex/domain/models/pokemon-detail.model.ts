export type PokemonDetail = {
  dexId: number;
  name: string;
  height: number | null;
  weight: number | null;
  baseExperience: number | null;
  spriteDefault: string | null;

  types: { slot: number; id: number; name: string }[];
  stats: { id: number; name: string; baseValue: number; effort: number }[];
  abilities: { id: number; name: string; slot: number; isHidden: boolean }[];
};
