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

    // Stage 1 (retrieve): fetch a base vector once.
    const baseVecRow = await this.prisma.$queryRaw<{ statsVector: string | null }[]>`
    SELECT "statsVector"::text as "statsVector"
    FROM "Pokemon"
    WHERE "dexId" = ${input.dexId}
    LIMIT 1;
  `;

    const baseVecText = baseVecRow[0]?.statsVector;
    if (!baseVecText) return [];

    // Retrieve more than needed, then rerank using type overlap.
    const topK = Math.max(limit * 5, 30); // e.g., 10 -> 50 candidates

    // Two-stage retrieval:
    // 1) kNN by statsVector distance
    // 2) rerank by shared types and return final top N
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
      SELECT bt."typeId"
      FROM "PokemonType" bt
      WHERE bt."pokemonDexId" = ${input.dexId}
    ),
    knn AS (
      SELECT
        p."dexId",
        p."name",
        p."spriteDefault",
        (p."statsVector" <-> ${baseVecText}::vector) AS dist
      FROM "Pokemon" p
      WHERE p."dexId" <> ${input.dexId}
        AND p."statsVector" IS NOT NULL
      ORDER BY p."statsVector" <-> ${baseVecText}::vector
      LIMIT ${topK}
    ),
    shared AS (
      SELECT
        pt."pokemonDexId" AS dex_id,
        COUNT(*)::int AS shared_count,
        ARRAY_AGG(DISTINCT t."name") AS shared_types
      FROM "PokemonType" pt
      JOIN base_types bt ON bt."typeId" = pt."typeId"
      JOIN "Type" t ON t."id" = pt."typeId"
      WHERE pt."pokemonDexId" <> ${input.dexId}
      GROUP BY pt."pokemonDexId"
    )
    SELECT
      k."dexId" AS "dexId",
      k."name" AS "name",
      k."spriteDefault" AS "spriteDefault",
      (
        -- Vector similarity: higher is better
        (1.0 / (1.0 + k.dist))
        +
        -- Type boost (rerank): cap at 2 shared types
        (0.15 * LEAST(COALESCE(s.shared_count, 0), 2))
      ) AS "score",
      COALESCE(s.shared_types, ARRAY[]::text[]) AS "sharedTypes"
    FROM knn k
    LEFT JOIN shared s ON s.dex_id = k."dexId"
    ORDER BY "score" DESC, k."dexId" ASC
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
