import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma';

@Controller()
export class ReadyController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('/ready')
  async ready() {
    try {
      // Ping simple a la DB
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ready',
        timestamp: new Date().toISOString()
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      throw new ServiceUnavailableException({
        status: 'not_ready',
        reason: 'db_unreachable',
        timestamp: new Date().toISOString()
      });
    }
  }
}
