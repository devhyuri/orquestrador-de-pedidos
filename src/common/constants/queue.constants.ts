export const QUEUE_NAMES = {
  ENRICHMENT: 'orders.enrichment',
  DLQ: 'orders.dlq',
} as const;

export const JOB_NAMES = {
  ENRICH_ORDER: 'ENRICH_ORDER',
} as const;

export const JOB_OPTIONS = {
  attempts: 5,
  backoff: {
    type: 'exponential' as const,
    delay: 2000,
  },
  removeOnComplete: {
    age: 3600, 
    count: 1000,
  },
  removeOnFail: {
    age: 86400, 
  },
} as const;
