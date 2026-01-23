import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma';
import {
  DexId,
  PokemonName,
  PokemonRepository,
  PokedexBrowseCriteria,
  PokemonDetail,
  PokemonListItem
} from '../../domain';
import { Prisma } from '@prisma/client';

@Injectable()
export class PokemonPrismaRepository implements PokemonRepository {
  constructor(private readonly prisma: PrismaService) {}

  async browse(criteria: PokedexBrowseCriteria): Promise<{ total: number; items: PokemonListItem[] }> {
    const where = this.buildWhere(criteria);

    const [total, rows] = await Promise.all([
      this.prisma.pokemon.count({ where }),
      this.prisma.pokemon.findMany({
        where,
        orderBy: { dexId: 'asc' },
        skip: criteria.offset,
        take: criteria.limit,
        select: {
          dexId: true,
          name: true,
          spriteDefault: true,
          types: {
            select: { slot: true, type: { select: { id: true, name: true } } },
            orderBy: { slot: 'asc' }
          }
        }
      })
    ]);

    return {
      total,
      items: rows.map((r) => ({
        dexId: r.dexId,
        name: r.name,
        spriteDefault: r.spriteDefault,
        types: r.types.map((t) => ({ slot: t.slot, id: t.type.id, name: t.type.name }))
      }))
    };
  }

  async findByDexId(dexId: DexId): Promise<PokemonDetail | null> {
    const p = await this.prisma.pokemon.findUnique({
      where: { dexId: dexId.value },
      include: {
        types: { orderBy: { slot: 'asc' }, include: { type: true } },
        stats: { include: { stat: true } },
        abilities: { orderBy: { slot: 'asc' }, include: { ability: true } }
      }
    });
    return p ? this.toDetail(p) : null;
  }

  async findByName(name: PokemonName): Promise<PokemonDetail | null> {
    const p = await this.prisma.pokemon.findUnique({
      where: { name: name.value },
      include: {
        types: { orderBy: { slot: 'asc' }, include: { type: true } },
        stats: { include: { stat: true } },
        abilities: { orderBy: { slot: 'asc' }, include: { ability: true } }
      }
    });
    return p ? this.toDetail(p) : null;
  }

  private buildWhere(c: PokedexBrowseCriteria): Prisma.PokemonWhereInput {
    // ✅ Escalable: no asumimos Kanto. Si no mandas rango/generación, no filtramos por dex.
    const where: Prisma.PokemonWhereInput = {};

    // Rango dex explícito
    if (c.dexFrom || c.dexTo) {
      const from = c.dexFrom ?? 1;
      const to = c.dexTo ?? 99999;
      where.dexId = { gte: Math.min(from, to), lte: Math.max(from, to) };
    }

    // Búsqueda por nombre
    if (c.q) {
      where.name = { contains: c.q, mode: 'insensitive' };
    }

    // Filtro por tipo (id o name)
    if (c.type) {
      const isNumeric = Number.isInteger(Number(c.type));
      where.types = {
        some: {
          OR: [
            { type: { name: { equals: c.type, mode: 'insensitive' } } },
            ...(isNumeric ? [{ type: { id: Number(c.type) } }] : [])
          ]
        }
      };
    }

    // generation: por ahora lo dejamos para cuando tengamos tabla Generation o mapping real
    // (para hacerlo "bien", lo implementamos con tabla Generation/Species más adelante)
    return where;
  }

  private toDetail(p: any): PokemonDetail {
    return {
      dexId: p.dexId,
      name: p.name,
      height: p.height ?? null,
      weight: p.weight ?? null,
      baseExperience: p.baseExperience ?? null,
      spriteDefault: p.spriteDefault ?? null,
      types: p.types.map((t: any) => ({ slot: t.slot, id: t.type.id, name: t.type.name })),
      stats: p.stats.map((s: any) => ({
        id: s.stat.id,
        name: s.stat.name,
        baseValue: s.baseValue,
        effort: s.effort
      })),
      abilities: p.abilities.map((a: any) => ({
        id: a.ability.id,
        name: a.ability.name,
        slot: a.slot,
        isHidden: a.isHidden
      }))
    };
  }
}
