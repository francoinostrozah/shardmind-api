import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma';

type StatRangeRow = { name: string; min: number; max: number };
type PokemonStatRow = { pokemonDexId: number; name: string; baseValue: number };

@Injectable()
export class BackfillPokemonStatsVectorHandler {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: { batchSize?: number }) {
    const batchSize = Math.min(Math.max(input.batchSize ?? 500, 50), 2000);

    // 1) Load global stat ranges for min-max normalization.
    const ranges = await this.prisma.$queryRaw<StatRangeRow[]>`
      SELECT
        s."name" as "name",
        MIN(ps."baseValue")::int as "min",
        MAX(ps."baseValue")::int as "max"
      FROM "PokemonStat" ps
      JOIN "Stat" s ON s."id" = ps."statId"
      WHERE s."name" IN ('hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed')
      GROUP BY s."name";
    `;

    const rangeMap = new Map<string, { min: number; max: number }>();
    for (const r of ranges) rangeMap.set(r.name, { min: r.min, max: r.max });

    const required = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];
    for (const key of required) {
      if (!rangeMap.has(key)) {
        throw new Error(`Missing stat range for: ${key}`);
      }
    }

    // 2) Iterate Pokémon rows in batches to avoid loading everything into memory.
    let updated = 0;
    let lastDexId = 0;

    while (true) {
      const pokemons = await this.prisma.pokemon.findMany({
        where: {
          dexId: { gt: lastDexId }
        },
        orderBy: { dexId: 'asc' },
        take: batchSize,
        select: { dexId: true }
      });

      if (pokemons.length === 0) break;

      const dexIds = pokemons.map((p) => p.dexId);
      lastDexId = pokemons[pokemons.length - 1].dexId;

      // 3) Load stats for this batch (wide pivot is done in TS for simplicity).
      const rows = await this.prisma.$queryRaw<PokemonStatRow[]>`
        SELECT
          ps."pokemonDexId" as "pokemonDexId",
          s."name" as "name",
          ps."baseValue"::int as "baseValue"
        FROM "PokemonStat" ps
        JOIN "Stat" s ON s."id" = ps."statId"
        WHERE ps."pokemonDexId" IN (${Prisma.join(dexIds)})
          AND s."name" IN ('hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed');
      `;

      const byPokemon = new Map<number, Map<string, number>>();
      for (const row of rows) {
        if (!byPokemon.has(row.pokemonDexId)) byPokemon.set(row.pokemonDexId, new Map());
        byPokemon.get(row.pokemonDexId)!.set(row.name, row.baseValue);
      }

      // 4) Update vectors using raw SQL because Prisma does not type pgvector natively.
      for (const dexId of dexIds) {
        const stats = byPokemon.get(dexId);
        if (!stats) continue;

        const values = required.map((k) => stats.get(k));
        if (values.some((v) => typeof v !== 'number')) continue;

        const vec = required.map((k) => {
          const v = stats.get(k)!;
          const { min, max } = rangeMap.get(k)!;
          const denom = max - min;

          // Min-max normalization in [0,1]. If denom is 0, fallback to 0.
          return denom === 0 ? 0 : (v - min) / denom;
        });

        const vecLiteral = `[${vec.map((x) => Number(x).toFixed(6)).join(',')}]`;
        await this.prisma.$executeRaw`
          UPDATE "Pokemon"
          SET "statsVector" = ${vecLiteral}::vector
          WHERE "dexId" = ${dexId};
        `;

        updated += 1;
      }
    }

    return { updated };
  }
}
