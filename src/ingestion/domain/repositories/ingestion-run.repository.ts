export type IngestionRunStatus = 'RUNNING' | 'SUCCESS' | 'FAILED';

export type IngestionRun = {
  id: string;
  source: string;
  status: IngestionRunStatus;
  startedAt: Date;
  finishedAt: Date | null;
  itemsTotal: number;
  itemsSuccess: number;
  itemsFailed: number;
};

export interface IngestionRunRepository {
  startRun(input: { source: string; generation: number; itemsTotal: number }): Promise<IngestionRun>;
  markProgress(runId: string, input: { itemsSuccess: number; itemsFailed: number }): Promise<void>;
  addError(runId: string, input: { entity: string; entityKey: string; message: string }): Promise<void>;
  finishRun(
    runId: string,
    input: { status: 'SUCCESS' | 'FAILED'; itemsSuccess: number; itemsFailed: number }
  ): Promise<IngestionRun>;
}
