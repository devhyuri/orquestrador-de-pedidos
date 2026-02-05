import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@common/enums/order-status.enum';
import { EnrichmentData, OrderError } from '@common/interfaces';

export class OrderResponseDto {
  @ApiProperty({
    description: 'ID interno do pedido (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'ID externo do pedido',
    example: 'ext-123',
  })
  externalOrderId: string;

  @ApiProperty({
    description: 'Chave de idempotência',
    example: 'unique-key-123',
  })
  idempotencyKey: string;

  @ApiProperty({
    description: 'Status atual do pedido',
    enum: OrderStatus,
    example: OrderStatus.ENRICHED,
  })
  status: OrderStatus;

  @ApiProperty({
    description: 'Payload original do pedido recebido via webhook',
    example: {
      order_id: 'ext-123',
      customer: { email: 'user@example.com', name: 'Ana Silva' },
      items: [{ sku: 'ABC123', qty: 2, unit_price: 59.9 }],
      currency: 'USD',
      idempotency_key: 'unique-key-123',
    },
  })
  payload: any;

  @ApiProperty({
    description: 'Valor total do pedido',
    example: '119.80',
  })
  totalAmount: string;

  @ApiProperty({
    description: 'Moeda do pedido',
    example: 'USD',
  })
  currency: string;

  @ApiProperty({
    description: 'Dados de enriquecimento (ex: conversão de moeda)',
    required: false,
    example: {
      exchange: {
        convertedAmount: 599.0,
        rate: 5.0,
        targetCurrency: 'BRL',
        providerMeta: {
          baseCurrency: 'USD',
          timestamp: '2026-02-04T12:00:00.000Z',
        },
      },
      originalAmount: 119.8,
      originalCurrency: 'USD',
    },
  })
  enrichmentData?: any;

  @ApiProperty({
    description: 'Detalhes do erro (se houver falha)',
    required: false,
    example: {
      message: 'Exchange API unavailable',
      attemptsMade: 5,
      sentToDLQ: true,
      timestamp: '2026-02-04T12:00:00.000Z',
    },
  })
  error?: OrderError;

  @ApiProperty({
    description: 'Data de criação do pedido',
    example: '2026-02-04T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2026-02-04T12:05:00.000Z',
  })
  updatedAt: Date;
}
