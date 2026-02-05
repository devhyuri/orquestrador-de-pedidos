import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QUEUE_NAMES } from '@common/constants/queue.constants';
import { EnrichmentProcessor } from './processors/enrichment.processor';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { OrdersModule } from '@orders/orders.module';
import { IntegrationsModule } from '@integrations/integrations.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      {
        name: QUEUE_NAMES.ENRICHMENT,
      },
      {
        name: QUEUE_NAMES.DLQ,
      },
    ),
    OrdersModule,
    IntegrationsModule,
  ],
  controllers: [QueueController],
  providers: [EnrichmentProcessor, QueueService],
  exports: [BullModule],
})
export class QueueModule {}
