export type IngestionRunReadModel = {
  id: string;
  source: string;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED';
  startedAt: Date;
  finishedAt: Date | null;
  itemsTotal: number;
  itemsSuccess: number;
  itemsFailed: number;
  generation: number; // Stored as rangeFrom/rangeTo
};
