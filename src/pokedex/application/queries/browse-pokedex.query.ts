import { PokedexBrowseCriteria } from '../../domain';

export class BrowsePokedexQuery {
  constructor(public readonly criteria: PokedexBrowseCriteria) {}
}
