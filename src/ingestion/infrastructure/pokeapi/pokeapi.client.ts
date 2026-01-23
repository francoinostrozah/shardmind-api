import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { PokeApiPokemonDetail } from './pokeapi.types';
import { PokedexPokemonUpsert } from '../../domain';

function idFromUrl(url: string): number {
  const m = url.match(/\/(\d+)\/?$/);
  if (!m) throw new Error(`Could not parse id from url: ${url}`);
  return Number(m[1]);
}

@Injectable()
export class PokeApiClient {
  private readonly http = axios.create({
    baseURL: 'https://pokeapi.co/api/v2',
    timeout: 20000
  });

  async getPokemon(dexId: number): Promise<PokedexPokemonUpsert> {
    const { data } = await this.http.get<PokeApiPokemonDetail>(`/pokemon/${dexId}`);

    return {
      dexId: data.id,
      name: data.name,
      height: data.height ?? null,
      weight: data.weight ?? null,
      baseExperience: data.base_experience ?? null,
      spriteDefault: data.sprites?.front_default ?? null,

      types: data.types.map((t) => ({
        id: idFromUrl(t.type.url),
        name: t.type.name,
        slot: t.slot
      })),

      stats: data.stats.map((s) => ({
        id: idFromUrl(s.stat.url),
        name: s.stat.name,
        baseValue: s.base_stat,
        effort: s.effort
      })),

      abilities: data.abilities.map((a) => ({
        id: idFromUrl(a.ability.url),
        name: a.ability.name,
        slot: a.slot,
        isHidden: a.is_hidden
      }))
    };
  }
}
