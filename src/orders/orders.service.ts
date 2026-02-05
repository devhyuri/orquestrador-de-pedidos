import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { OrderStatus } from '@common/enums/order-status.enum';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { EnrichmentData, OrderError } from '@common/interfaces';
import { Order } from '@prisma/client';
import { PAGINATION_DEFAULTS } from '@common/constants/pagination.constants';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderDto, totalAmount: number): Promise<OrderResponseDto> {
    const order = await this.prisma.order.create({
      data: {
        externalOrderId: dto.order_id,
        idempotencyKey: dto.idempotency_key,
        status: OrderStatus.RECEIVED,
        payload: JSON.parse(JSON.stringify(dto)),
        totalAmount: totalAmount,
        currency: dto.currency,
      },
    });

    this.logger.log(`Order created: ${order.id} (external: ${order.externalOrderId})`);

    return this.mapToDto(order);
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<OrderResponseDto | null> {
    const order = await this.prisma.order.findUnique({
      where: { idempotencyKey },
    });

    return order ? this.mapToDto(order) : null;
  }

  async findById(id: string): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    return this.mapToDto(order);
  }

  async list(query: ListOrdersQueryDto) {
    const { page = PAGINATION_DEFAULTS.PAGE, limit = PAGINATION_DEFAULTS.LIMIT, status } = query;
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders.map((order) => this.mapToDto(order)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateStatus(id: string, status: OrderStatus): Promise<OrderResponseDto> {
    const order = await this.prisma.order.update({
      where: { id },
      data: { status },
    });

    this.logger.log(`Order ${id} status updated to ${status}`);

    return this.mapToDto(order);
  }

  async updateEnrichment(
    id: string,
    enrichmentData: EnrichmentData,
    status: OrderStatus = OrderStatus.ENRICHED,
  ): Promise<OrderResponseDto> {
    const order = await this.prisma.order.update({
      where: { id },
      data: {
        enrichmentData,
        status,
      },
    });

    this.logger.log(`Order ${id} enriched`);

    return this.mapToDto(order);
  }

  async updateError(
    id: string,
    error: OrderError,
    status: OrderStatus = OrderStatus.FAILED_ENRICHMENT,
  ): Promise<OrderResponseDto> {
    const errorWithTimestamp: OrderError = {
      ...error,
      timestamp: new Date().toISOString(),
    };

    const order = await this.prisma.order.update({
      where: { id },
      data: {
        error: errorWithTimestamp,
        status,
      },
    });

    this.logger.error(`Order ${id} failed: ${error.message}`, error.stack);

    return this.mapToDto(order);
  }

  private mapToDto(order: Order): OrderResponseDto {
    return {
      id: order.id,
      externalOrderId: order.externalOrderId,
      idempotencyKey: order.idempotencyKey,
      status: order.status,
      payload: order.payload,
      totalAmount: order.totalAmount.toString(),
      currency: order.currency,
      enrichmentData: order.enrichmentData,
      error: order.error,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
