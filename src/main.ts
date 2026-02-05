import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Order Orchestrator API')
    .setDescription(
      'API para receber pedidos via webhook, validar, enfileirar e enriquecer dados através de integrações externas.',
    )
    .setVersion('1.0')
    .addTag('webhooks', 'Endpoints para recebimento de pedidos via webhook')
    .addTag('orders', 'Endpoints para consulta e gerenciamento de pedidos')
    .addTag('queue', 'Endpoints para métricas e monitoramento de filas')
    .addTag('health', 'Health check da aplicação')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 Swagger documentation available at: http://localhost:${port}/api`);
}

bootstrap();
