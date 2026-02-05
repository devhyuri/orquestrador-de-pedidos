import { Module } from '@nestjs/common';
import { ExchangeService } from './exchange/exchange.service';
import { CepService } from './cep/cep.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [ExchangeService, CepService],
  exports: [ExchangeService, CepService],
})
export class IntegrationsModule {}
