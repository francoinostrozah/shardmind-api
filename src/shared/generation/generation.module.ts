import { Global, Module } from '@nestjs/common';
import { GENERATION_TOKENS } from './generation.tokens';
import { GenerationPrismaRepository } from './infrastructure';

@Global()
@Module({
  providers: [
    GenerationPrismaRepository,
    { provide: GENERATION_TOKENS.Repository, useExisting: GenerationPrismaRepository }
  ],
  exports: [GENERATION_TOKENS.Repository]
})
export class GenerationModule {}
