export class PokemonName {
  private constructor(public readonly value: string) {}

  static of(raw: string): PokemonName {
    const v = (raw ?? '').trim().toLowerCase();
    if (!v) throw new Error('PokemonName cannot be empty');

    // PokéAPI uses kebab-case for forms, e.g. "mr-mime", "deoxys-attack".
    // We allow letters, numbers, and hyphens.
    if (!/^[a-z0-9-]+$/.test(v)) {
      throw new Error('PokemonName has invalid characters');
    }
    return new PokemonName(v);
  }
}
