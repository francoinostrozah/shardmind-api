import { Generation } from '../../domain';

export class SyncPokedexGenerationCommand {
  constructor(public readonly generation: Generation) {}
}
