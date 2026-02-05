import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksService } from './webhooks.service';
import { OrdersService } from '@orders/orders.service';
import { getQueueToken } from '@nestjs/bull';
import { QUEUE_NAMES } from '@common/constants/queue.constants';

describe('WebhooksService', () => {
  let service: WebhooksService;
  let ordersService: OrdersService;
  let enrichmentQueue: any;

  const mockOrdersService = {
    findByIdempotencyKey: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
        {
          provide: getQueueToken(QUEUE_NAMES.ENRICHMENT),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
    ordersService = module.get<OrdersService>(OrdersService);
    enrichmentQueue = module.get(getQueueToken(QUEUE_NAMES.ENRICHMENT));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processWebhook', () => {
    it('should return existing order if idempotency key exists', async () => {
      const existingOrder = {
        id: 'existing-id',
        idempotencyKey: 'key-123',
        status: 'ENRICHED',
      };

      mockOrdersService.findByIdempotencyKey.mockResolvedValue(existingOrder);

      const dto = {
        order_id: 'ext-123',
        customer: { email: 'test@example.com', name: 'Test' },
        items: [{ sku: 'ABC', qty: 1, unit_price: 10 }],
        currency: 'USD',
        idempotency_key: 'key-123',
      };

      const result = await service.processWebhook(dto);

      expect(result).toEqual(existingOrder);
      expect(mockOrdersService.create).not.toHaveBeenCalled();
      expect(enrichmentQueue.add).not.toHaveBeenCalled();
    });
  });
});
