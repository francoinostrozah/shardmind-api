import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma';
import { PokedexUpsertRepository, PokedexPokemonUpsert } from '../../domain';

@Injectable()
export class PokedexUpsertPrismaRepository implements PokedexUpsertRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertPokemon(data: PokedexPokemonUpsert): Promise<void> {
    const dexId = data.dexId;

    // 1) Upsert Pokemon base
    await this.prisma.pokemon.upsert({
      where: { dexId },
      create: {
        dexId,
        name: data.name,
        height: data.height ?? undefined,
        weight: data.weight ?? undefined,
        baseExperience: data.baseExperience ?? undefined,
        spriteDefault: data.spriteDefault ?? undefined
      },
      update: {
        name: data.name,
        height: data.height ?? undefined,
        weight: data.weight ?? undefined,
        baseExperience: data.baseExperience ?? undefined,
        spriteDefault: data.spriteDefault ?? undefined
      }
    });

    // 2) Types + join
    for (const t of data.types) {
      await this.prisma.type.upsert({
        where: { id: t.id },
        create: { id: t.id, name: t.name },
        update: { name: t.name }
      });

      await this.prisma.pokemonType.upsert({
        where: { pokemonDexId_typeId: { pokemonDexId: dexId, typeId: t.id } },
        create: { pokemonDexId: dexId, typeId: t.id, slot: t.slot },
        update: { slot: t.slot }
      });
    }

    // 3) Stats + join
    for (const s of data.stats) {
      await this.prisma.stat.upsert({
        where: { id: s.id },
        create: { id: s.id, name: s.name },
        update: { name: s.name }
      });

      await this.prisma.pokemonStat.upsert({
        where: { pokemonDexId_statId: { pokemonDexId: dexId, statId: s.id } },
        create: { pokemonDexId: dexId, statId: s.id, baseValue: s.baseValue, effort: s.effort },
        update: { baseValue: s.baseValue, effort: s.effort }
      });
    }

    // 4) Abilities + join
    for (const a of data.abilities) {
      await this.prisma.ability.upsert({
        where: { id: a.id },
        create: { id: a.id, name: a.name },
        update: { name: a.name }
      });

      await this.prisma.pokemonAbility.upsert({
        where: { pokemonDexId_abilityId: { pokemonDexId: dexId, abilityId: a.id } },
        create: { pokemonDexId: dexId, abilityId: a.id, slot: a.slot, isHidden: a.isHidden },
        update: { slot: a.slot, isHidden: a.isHidden }
      });
    }
  }
}
