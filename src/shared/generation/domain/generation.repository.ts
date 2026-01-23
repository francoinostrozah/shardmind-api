import { GenerationModel } from './generation.model';

export interface GenerationRepository {
  findAll(): Promise<GenerationModel[]>;
  findById(id: number): Promise<GenerationModel | null>;
}
