import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PokemonRepository } from '../../domain';
import { LookupPokemonByDexIdQuery } from '../queries';

@Injectable()
export class LookupPokemonByDexIdHandler {
  constructor(@Inject('PokemonRepository') private readonly repo: PokemonRepository) {}

  async execute(query: LookupPokemonByDexIdQuery) {
    const pokemon = await this.repo.findByDexId(query.dexId);
    if (!pokemon) throw new NotFoundException('Pokemon not found');
    return pokemon;
  }
}
