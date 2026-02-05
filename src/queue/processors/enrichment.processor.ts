import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { OrdersService } from '@orders/orders.service';
import { ExchangeService } from '@integrations/exchange/exchange.service';
import { QUEUE_NAMES, JOB_OPTIONS } from '@common/constants/queue.constants';
import { OrderStatus } from '@common/enums/order-status.enum';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EnrichmentData } from '@common/interfaces';

export interface EnrichOrderJobData {
  orderId: string;
  externalOrderId: string;
  currency: string;
  totalAmount: number;
}

@Processor(QUEUE_NAMES.ENRICHMENT)
export class EnrichmentProcessor {
  private readonly logger = new Logger(EnrichmentProcessor.name);

  constructor(
    private readonly ordersService: OrdersService,
    private readonly exchangeService: ExchangeService,
    @InjectQueue(QUEUE_NAMES.DLQ) private readonly dlqQueue: Queue,
  ) {}

  @Process('ENRICH_ORDER')
  async handleEnrichment(job: Job<EnrichOrderJobData>) {
    const { orderId, externalOrderId, currency, totalAmount } = job.data;
    const attemptsMade = job.attemptsMade;
    const maxAttempts = job.opts.attempts || JOB_OPTIONS.attempts;

    this.logger.log(
      `Processing enrichment for order ${orderId} (attempt ${attemptsMade + 1}/${maxAttempts})`,
    );

    try {
      // Atualizar status para PROCESSING_ENRICHMENT
      await this.ordersService.updateStatus(orderId, OrderStatus.PROCESSING_ENRICHMENT);

      // Chamar integração externa (conversão de moeda)
      const exchangeResult = await this.exchangeService.convertToBRL(totalAmount, currency);

      // Salvar enrichment
      const enrichmentData: EnrichmentData = {
        exchange: exchangeResult,
        originalAmount: totalAmount,
        originalCurrency: currency,
      };
      await this.ordersService.updateEnrichment(orderId, enrichmentData);

      this.logger.log(`Order ${orderId} enriched successfully`);

      return { success: true, orderId, enrichment: exchangeResult };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Error enriching order ${orderId} (attempt ${attemptsMade + 1}/${maxAttempts}): ${errorMessage}`,
        errorStack,
      );

      // Se esgotou as tentativas, enviar para DLQ
      if (attemptsMade + 1 >= maxAttempts) {
        this.logger.warn(
          `Max attempts reached for order ${orderId}, sending to DLQ`,
        );

        await this.dlqQueue.add(
          {
            orderId,
            externalOrderId,
            currency,
            totalAmount,
            error: {
              message: errorMessage,
              stack: errorStack,
              attemptsMade: attemptsMade + 1,
            },
          },
          {
            attempts: 1,
          },
        );

        // Atualizar status para FAILED_ENRICHMENT
        await this.ordersService.updateError(
          orderId,
          {
            message: errorMessage,
            stack: errorStack,
            attemptsMade: attemptsMade + 1,
            sentToDLQ: true,
          },
          OrderStatus.FAILED_ENRICHMENT,
        );
      }

      // Re-throw para BullMQ contabilizar o retry
      throw error;
    }
  }
}
