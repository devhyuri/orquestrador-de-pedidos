import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { WebhookOrderDto } from './dto/webhook-order.dto';
import { OrderResponseDto } from '@orders/dto/order-response.dto';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('orders')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Receber pedido via webhook',
    description:
      'Recebe um pedido via webhook, valida o payload, garante idempotência e enfileira para processamento assíncrono. Se o pedido já existe (mesma idempotency_key), retorna o pedido existente sem criar novo.',
  })
  @ApiBody({ type: WebhookOrderDto })
  @ApiResponse({
    status: 202,
    description: 'Pedido recebido e enfileirado com sucesso',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Payload inválido ou validação falhou',
  })
  async receiveOrder(@Body() dto: WebhookOrderDto): Promise<OrderResponseDto> {
    return this.webhooksService.processWebhook(dto);
  }
}
