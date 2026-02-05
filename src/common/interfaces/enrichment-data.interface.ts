import { ExchangeRateResponse } from '@integrations/exchange/exchange.service';

export interface EnrichmentData {
  exchange: ExchangeRateResponse;
  originalAmount: number;
  originalCurrency: string;
}
