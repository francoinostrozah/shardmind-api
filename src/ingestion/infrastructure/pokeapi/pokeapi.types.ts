export type PokeApiPokemonDetail = {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number;
  sprites: { front_default: string | null };
  types: { slot: number; type: { name: string; url: string } }[];
  stats: { base_stat: number; effort: number; stat: { name: string; url: string } }[];
  abilities: { slot: number; is_hidden: boolean; ability: { name: string; url: string } }[];
};
