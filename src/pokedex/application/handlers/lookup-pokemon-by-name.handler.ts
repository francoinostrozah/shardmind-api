import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PokemonRepository } from '../../domain';
import { LookupPokemonByNameQuery } from '../queries';

@Injectable()
export class LookupPokemonByNameHandler {
  constructor(@Inject('PokemonRepository') private readonly repo: PokemonRepository) {}

  async execute(query: LookupPokemonByNameQuery) {
    const pokemon = await this.repo.findByName(query.name);
    if (!pokemon) throw new NotFoundException('Pokemon not found');
    return pokemon;
  }
}
