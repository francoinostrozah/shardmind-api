import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { ReadyController } from './ready.controller';
import { PrismaService } from 'src/shared/prisma';

@Module({
  controllers: [HealthController, ReadyController],
  providers: [PrismaService]
})
export class HealthModule {}
