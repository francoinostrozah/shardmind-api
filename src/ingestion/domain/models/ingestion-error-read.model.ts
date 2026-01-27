export type IngestionErrorReadModel = {
  id: string;
  runId: string;
  entity: string;
  entityKey: string;
  message: string;
  createdAt: Date;
};
