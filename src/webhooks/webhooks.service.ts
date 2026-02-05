import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { OrdersService } from '@orders/orders.service';
import { WebhookOrderDto } from './dto/webhook-order.dto';
import { OrderResponseDto } from '@orders/dto/order-response.dto';
import { QUEUE_NAMES, JOB_NAMES, JOB_OPTIONS } from '@common/constants/queue.constants';
import { OrderStatus } from '@common/enums/order-status.enum';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly ordersService: OrdersService,
    @InjectQueue(QUEUE_NAMES.ENRICHMENT) private readonly enrichmentQueue: Queue,
  ) {}

  async processWebhook(dto: WebhookOrderDto): Promise<OrderResponseDto> {
    // Verificar idempotência
    const existingOrder = await this.ordersService.findByIdempotencyKey(dto.idempotency_key);

    if (existingOrder) {
      this.logger.log(
        `Idempotent request detected for key: ${dto.idempotency_key}, returning existing order: ${existingOrder.id}`,
      );
      return existingOrder;
    }

    // Calcular total
    const totalAmount = dto.items.reduce(
      (sum, item) => sum + item.qty * item.unit_price,
      0,
    );

    // Criar pedido
    const order = await this.ordersService.create(dto, totalAmount);

    // Enfileirar job com opções de retry e backoff
    await this.enrichmentQueue.add(JOB_NAMES.ENRICH_ORDER, {
      orderId: order.id,
      externalOrderId: order.externalOrderId,
      currency: order.currency,
      totalAmount: parseFloat(order.totalAmount),
    }, JOB_OPTIONS);

    // Atualizar status para ENQUEUED
    const updatedOrder = await this.ordersService.updateStatus(order.id, OrderStatus.ENQUEUED);

    this.logger.log(`Order ${order.id} enqueued for enrichment`);

    return updatedOrder;
  }
}
