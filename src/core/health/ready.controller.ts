import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { PrismaService } from 'src/shared/prisma';

@Controller()
export class ReadyController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger
  ) {}

  @Get('/ready')
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ready',
        timestamp: new Date().toISOString()
      };
    } catch (e: any) {
      this.logger.error(
        {
          err: {
            name: e?.name,
            code: e?.code,
            message: e?.message
          }
        },
        'Readiness check failed (DB unreachable)'
      );

      throw new ServiceUnavailableException({
        status: 'not_ready',
        reason: 'db_unreachable',
        timestamp: new Date().toISOString()
      });
    }
  }
}
