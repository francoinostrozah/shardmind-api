export type PokemonListItem = {
  dexId: number;
  name: string;
  spriteDefault: string | null;
  types: { slot: number; id: number; name: string }[];
};
