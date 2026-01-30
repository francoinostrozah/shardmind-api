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

    const sort = criteria.sort ?? 'dexId';
    const direction = criteria.direction ?? 'asc';

    // Cursor pagination is only safe/consistent with a unique, monotonic key.
    // We support cursor only for dexId sorting.
    const useCursor = typeof criteria.cursor === 'number' && sort === 'dexId';

    const findManyArgs: any = {
      where,
      take: criteria.limit,
      orderBy: { [sort]: direction },
      select: {
        dexId: true,
        name: true,
        spriteDefault: true,
        types: {
          select: { slot: true, type: { select: { id: true, name: true } } },
          orderBy: { slot: 'asc' }
        }
      }
    };

    if (useCursor) {
      // Keyset pagination using Prisma cursor.
      // We skip the cursor row itself to avoid repeating it.
      findManyArgs.cursor = { dexId: criteria.cursor };
      findManyArgs.skip = 1;
    } else {
      // Offset pagination fallback (works for any sort).
      findManyArgs.skip = criteria.offset;
    }

    const [total, rows] = await Promise.all([
      this.prisma.pokemon.count({ where }),
      this.prisma.pokemon.findMany(findManyArgs)
    ]);

    return {
      total,
      items: rows.map((r: any) => ({
        dexId: r.dexId,
        name: r.name,
        spriteDefault: r.spriteDefault,
        types: r.types.map((t: any) => ({ slot: t.slot, id: t.type.id, name: t.type.name }))
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

  async suggestByName(input: { q: string; limit: number; minScore?: number }) {
    // Normalize input similarly to how Pokemon names are stored (lowercase)
    const q = input.q.trim().toLowerCase();
    const limit = Math.min(Math.max(input.limit, 1), 20);
    const minScore = input.minScore ?? 0.25;

    // Uses pg_trgm:
    // - similarity(name, q) returns 0..1
    // - name % q uses trigram similarity operator (index-friendly with GIN)
    const rows = await this.prisma.$queryRaw<
      { dexId: number; name: string; spriteDefault: string | null; score: number }[]
    >`
      SELECT
        p."dexId" as "dexId",
        p."name" as "name",
        p."spriteDefault" as "spriteDefault",
        similarity(p."name", ${q}) as "score"
      FROM "Pokemon" p
      WHERE p."name" % ${q}
        AND similarity(p."name", ${q}) >= ${minScore}
      ORDER BY "score" DESC, p."dexId" ASC
      LIMIT ${limit};
    `;

    return rows.map((r) => ({
      dexId: r.dexId,
      name: r.name,
      spriteDefault: r.spriteDefault,
      score: Number(r.score)
    }));
  }

  async findSimilarByDexId(input: { dexId: number; limit: number }) {
    const limit = Math.min(Math.max(input.limit, 1), 50);

    // This query:
    // 1) Builds the base Pokémon feature set (types + stats).
    // 2) Scores all other Pokémon by:
    //    - type overlap weight
    //    - inverse L1 distance on stats
    // 3) Returns the top results.
    const rows = await this.prisma.$queryRaw<
      {
        dexId: number;
        name: string;
        spriteDefault: string | null;
        score: number;
        sharedTypes: string[];
      }[]
    >`
      WITH base_types AS (
        SELECT pt."typeId", pt."slot"
        FROM "PokemonType" pt
        WHERE pt."pokemonDexId" = ${input.dexId}
      ),
      -- Stat ranges (min/max) used for min-max normalization.
      stat_ranges AS (
        SELECT
          s."name" AS stat_name,
          MIN(ps."baseValue") AS min_val,
          MAX(ps."baseValue") AS max_val
        FROM "PokemonStat" ps
        JOIN "Stat" s ON s."id" = ps."statId"
        GROUP BY s."name"
      ),
      base_stats AS (
        SELECT
          MAX(CASE WHEN s."name" = 'hp' THEN ps."baseValue" END) AS hp,
          MAX(CASE WHEN s."name" = 'attack' THEN ps."baseValue" END) AS attack,
          MAX(CASE WHEN s."name" = 'defense' THEN ps."baseValue" END) AS defense,
          MAX(CASE WHEN s."name" = 'special-attack' THEN ps."baseValue" END) AS sp_attack,
          MAX(CASE WHEN s."name" = 'special-defense' THEN ps."baseValue" END) AS sp_defense,
          MAX(CASE WHEN s."name" = 'speed' THEN ps."baseValue" END) AS speed
        FROM "PokemonStat" ps
        JOIN "Stat" s ON s."id" = ps."statId"
        WHERE ps."pokemonDexId" = ${input.dexId}
      ),
      candidate_stats AS (
        SELECT
          p."dexId",
          p."name",
          p."spriteDefault",
          MAX(CASE WHEN s."name" = 'hp' THEN ps."baseValue" END) AS hp,
          MAX(CASE WHEN s."name" = 'attack' THEN ps."baseValue" END) AS attack,
          MAX(CASE WHEN s."name" = 'defense' THEN ps."baseValue" END) AS defense,
          MAX(CASE WHEN s."name" = 'special-attack' THEN ps."baseValue" END) AS sp_attack,
          MAX(CASE WHEN s."name" = 'special-defense' THEN ps."baseValue" END) AS sp_defense,
          MAX(CASE WHEN s."name" = 'speed' THEN ps."baseValue" END) AS speed
        FROM "Pokemon" p
        JOIN "PokemonStat" ps ON ps."pokemonDexId" = p."dexId"
        JOIN "Stat" s ON s."id" = ps."statId"
        WHERE p."dexId" <> ${input.dexId}
        GROUP BY p."dexId", p."name", p."spriteDefault"
      ),
      candidate_type_score AS (
        SELECT
          pt."pokemonDexId" AS dex_id,
          SUM(
            CASE
              WHEN bt."slot" = 1 AND pt."slot" = 1 THEN 1.0
              WHEN bt."slot" = 2 AND pt."slot" = 2 THEN 0.6
              ELSE 0.4
            END
          ) AS type_score,
          ARRAY_AGG(DISTINCT t."name") AS shared_types
        FROM "PokemonType" pt
        JOIN base_types bt ON bt."typeId" = pt."typeId"
        JOIN "Type" t ON t."id" = pt."typeId"
        WHERE pt."pokemonDexId" <> ${input.dexId}
        GROUP BY pt."pokemonDexId"
      )
      SELECT
        cs."dexId" AS "dexId",
        cs."name" AS "name",
        cs."spriteDefault" AS "spriteDefault",
        (
          COALESCE(cts.type_score, 0) +
          (1.0 / (1.0 + SQRT(
            -- Normalized Euclidean distance across base stats
            POWER(
              ((cs.hp - r_hp.min_val)::float / NULLIF((r_hp.max_val - r_hp.min_val), 0)) -
              ((bs.hp - r_hp.min_val)::float / NULLIF((r_hp.max_val - r_hp.min_val), 0)),
              2
            ) +
            POWER(
              ((cs.attack - r_atk.min_val)::float / NULLIF((r_atk.max_val - r_atk.min_val), 0)) -
              ((bs.attack - r_atk.min_val)::float / NULLIF((r_atk.max_val - r_atk.min_val), 0)),
              2
            ) +
            POWER(
              ((cs.defense - r_def.min_val)::float / NULLIF((r_def.max_val - r_def.min_val), 0)) -
              ((bs.defense - r_def.min_val)::float / NULLIF((r_def.max_val - r_def.min_val), 0)),
              2
            ) +
            POWER(
              ((cs.sp_attack - r_spa.min_val)::float / NULLIF((r_spa.max_val - r_spa.min_val), 0)) -
              ((bs.sp_attack - r_spa.min_val)::float / NULLIF((r_spa.max_val - r_spa.min_val), 0)),
              2
            ) +
            POWER(
              ((cs.sp_defense - r_spd.min_val)::float / NULLIF((r_spd.max_val - r_spd.min_val), 0)) -
              ((bs.sp_defense - r_spd.min_val)::float / NULLIF((r_spd.max_val - r_spd.min_val), 0)),
              2
            ) +
            POWER(
              ((cs.speed - r_spe.min_val)::float / NULLIF((r_spe.max_val - r_spe.min_val), 0)) -
              ((bs.speed - r_spe.min_val)::float / NULLIF((r_spe.max_val - r_spe.min_val), 0)),
              2
            )
          )))
        ) AS "score",
        COALESCE(cts.shared_types, ARRAY[]::text[]) AS "sharedTypes"
      FROM candidate_stats cs
      CROSS JOIN base_stats bs
      LEFT JOIN candidate_type_score cts ON cts.dex_id = cs."dexId"
      -- Join stat ranges for normalization (one row per stat)
      JOIN stat_ranges r_hp  ON r_hp.stat_name = 'hp'
      JOIN stat_ranges r_atk ON r_atk.stat_name = 'attack'
      JOIN stat_ranges r_def ON r_def.stat_name = 'defense'
      JOIN stat_ranges r_spa ON r_spa.stat_name = 'special-attack'
      JOIN stat_ranges r_spd ON r_spd.stat_name = 'special-defense'
      JOIN stat_ranges r_spe ON r_spe.stat_name = 'speed'
      ORDER BY "score" DESC, cs."dexId" ASC
      LIMIT ${limit};
    `;

    return rows.map((r) => ({
      dexId: r.dexId,
      name: r.name,
      spriteDefault: r.spriteDefault,
      score: Number(r.score),
      sharedTypes: r.sharedTypes ?? []
    }));
  }
}
