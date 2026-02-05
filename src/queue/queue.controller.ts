import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { QueueService } from './queue.service';
import { QueueMetricsResponseDto } from './dto/queue-metrics.dto';

@ApiTags('queue')
@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get('metrics')
  @ApiOperation({
    summary: 'Obter métricas das filas',
    description: 'Retorna contadores das filas de processamento e DLQ (Dead Letter Queue)',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas retornadas com sucesso',
    type: QueueMetricsResponseDto,
  })
  async getMetrics() {
    return this.queueService.getMetrics();
  }
}
