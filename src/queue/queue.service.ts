import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { QUEUE_NAMES } from '@common/constants/queue.constants';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(QUEUE_NAMES.ENRICHMENT) private readonly enrichmentQueue: Queue,
    @InjectQueue(QUEUE_NAMES.DLQ) private readonly dlqQueue: Queue,
  ) {}

  async getMetrics() {
    const [enrichmentCounts, dlqCounts] = await Promise.all([
      this.enrichmentQueue.getJobCounts(),
      this.dlqQueue.getJobCounts(),
    ]);

    return {
      enrichmentQueue: {
        waiting: enrichmentCounts.waiting,
        active: enrichmentCounts.active,
        completed: enrichmentCounts.completed,
        failed: enrichmentCounts.failed,
        delayed: enrichmentCounts.delayed,
      },
      dlq: {
        waiting: dlqCounts.waiting,
        active: dlqCounts.active,
        completed: dlqCounts.completed,
        failed: dlqCounts.failed,
        delayed: dlqCounts.delayed,
      },
    };
  }
}
