import { ApiProperty } from '@nestjs/swagger';

export class QueueCountsDto {
  @ApiProperty({
    description: 'Jobs aguardando processamento',
    example: 0,
  })
  waiting: number;

  @ApiProperty({
    description: 'Jobs sendo processados',
    example: 1,
  })
  active: number;

  @ApiProperty({
    description: 'Jobs completados',
    example: 42,
  })
  completed: number;

  @ApiProperty({
    description: 'Jobs que falharam',
    example: 2,
  })
  failed: number;

  @ApiProperty({
    description: 'Jobs com delay',
    example: 0,
  })
  delayed: number;
}

export class QueueMetricsResponseDto {
  @ApiProperty({
    description: 'Métricas da fila de enriquecimento',
    type: QueueCountsDto,
  })
  enrichmentQueue: QueueCountsDto;

  @ApiProperty({
    description: 'Métricas da Dead Letter Queue (DLQ)',
    type: QueueCountsDto,
  })
  dlq: QueueCountsDto;
}
