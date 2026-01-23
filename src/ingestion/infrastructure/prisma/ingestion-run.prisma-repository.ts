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
}
