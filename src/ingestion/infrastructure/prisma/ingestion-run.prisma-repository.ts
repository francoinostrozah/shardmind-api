import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma';
import { IngestionRunRepository, IngestionRun } from '../../domain';

@Injectable()
export class IngestionRunPrismaRepository implements IngestionRunRepository {
  constructor(private readonly prisma: PrismaService) {}

  async startRun(input: { source: string; generation: number; itemsTotal: number }): Promise<IngestionRun> {
    const run = await this.prisma.ingestionRun.create({
      data: {
        source: input.source,
        rangeFrom: input.generation, // We reuse rangeFrom / rangeTo for "generation" if the schema already exists
        rangeTo: input.generation,
        itemsTotal: input.itemsTotal
      }
    });

    return {
      id: run.id,
      source: run.source,
      status: run.status as any,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      itemsTotal: run.itemsTotal,
      itemsSuccess: run.itemsSuccess,
      itemsFailed: run.itemsFailed
    };
  }

  async markProgress(runId: string, input: { itemsSuccess: number; itemsFailed: number }): Promise<void> {
    await this.prisma.ingestionRun.update({
      where: { id: runId },
      data: { itemsSuccess: input.itemsSuccess, itemsFailed: input.itemsFailed }
    });
  }

  async addError(runId: string, input: { entity: string; entityKey: string; message: string }): Promise<void> {
    await this.prisma.ingestionError.create({
      data: { runId, entity: input.entity, entityKey: input.entityKey, message: input.message }
    });
  }

  async finishRun(
    runId: string,
    input: { status: 'SUCCESS' | 'FAILED'; itemsSuccess: number; itemsFailed: number }
  ): Promise<IngestionRun> {
    const run = await this.prisma.ingestionRun.update({
      where: { id: runId },
      data: {
        status: input.status,
        finishedAt: new Date(),
        itemsSuccess: input.itemsSuccess,
        itemsFailed: input.itemsFailed
      }
    });

    return {
      id: run.id,
      source: run.source,
      status: run.status as any,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      itemsTotal: run.itemsTotal,
      itemsSuccess: run.itemsSuccess,
      itemsFailed: run.itemsFailed
    };
  }

  // Read-side: list ingestion runs for observability
  async listRuns(input: { limit: number; offset: number }) {
    const [total, rows] = await Promise.all([
      this.prisma.ingestionRun.count(),
      this.prisma.ingestionRun.findMany({
        orderBy: { startedAt: 'desc' },
        skip: input.offset,
        take: input.limit
      })
    ]);

    return {
      total,
      items: rows.map((r) => ({
        id: r.id,
        source: r.source,
        status: r.status as any,
        startedAt: r.startedAt,
        finishedAt: r.finishedAt,
        itemsTotal: r.itemsTotal,
        itemsSuccess: r.itemsSuccess,
        itemsFailed: r.itemsFailed,
        generation: r.rangeFrom
      }))
    };
  }

  // Read-side: list ingestion errors for a given run
  async listRunErrors(input: { runId: string; limit: number; offset: number }) {
    const where = { runId: input.runId };

    const [total, rows] = await Promise.all([
      this.prisma.ingestionError.count({ where }),
      this.prisma.ingestionError.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: input.offset,
        take: input.limit
      })
    ]);

    return {
      total,
      items: rows.map((e) => ({
        id: e.id,
        runId: e.runId,
        entity: e.entity,
        entityKey: e.entityKey,
        message: e.message,
        createdAt: e.createdAt
      }))
    };
  }
}
