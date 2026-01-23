import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { GenerationModel, GenerationRepository } from '../domain';

@Injectable()
export class GenerationPrismaRepository implements GenerationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<GenerationModel[]> {
    const rows = await this.prisma.generation.findMany({ orderBy: { id: 'asc' } });
    return rows.map((g) => ({ id: g.id, name: g.name, dexFrom: g.dexFrom, dexTo: g.dexTo }));
  }

  async findById(id: number): Promise<GenerationModel | null> {
    const g = await this.prisma.generation.findUnique({ where: { id } });
    return g ? { id: g.id, name: g.name, dexFrom: g.dexFrom, dexTo: g.dexTo } : null;
  }
}
