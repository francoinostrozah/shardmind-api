import { Controller, Get, Inject } from '@nestjs/common';
import { GENERATION_TOKENS, GenerationRepository } from 'src/shared/generation';

@Controller('v1/generations')
export class GenerationsController {
  constructor(@Inject(GENERATION_TOKENS.Repository) private readonly generations: GenerationRepository) {}

  @Get()
  list() {
    return this.generations.findAll();
  }
}
