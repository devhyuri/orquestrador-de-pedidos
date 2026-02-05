import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface ExchangeRateResponse {
  convertedAmount: number;
  rate: number;
  targetCurrency: string;
  providerMeta: {
    baseCurrency: string;
    timestamp: string;
  };
}

@Injectable()
export class ExchangeService {
  private readonly logger = new Logger(ExchangeService.name);
  private readonly httpClient: AxiosInstance;
  private readonly apiUrl: string;
  private readonly timeout: number;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('exchange.apiUrl');
    this.timeout = this.configService.get<number>('exchange.timeout');

    this.httpClient = axios.create({
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async convertToBRL(amount: number, fromCurrency: string): Promise<ExchangeRateResponse> {
    try {
      this.logger.log(`Converting ${amount} ${fromCurrency} to BRL`);

      const response = await this.httpClient.get(`${this.apiUrl}/${fromCurrency}`);

      if (!response.data || !response.data.rates) {
        throw new HttpException(
          'Invalid response from exchange API',
          HttpStatus.BAD_GATEWAY,
        );
      }

      const rate = response.data.rates.BRL;
      if (!rate || typeof rate !== 'number') {
        throw new HttpException(
          'BRL rate not found in exchange API response',
          HttpStatus.BAD_GATEWAY,
        );
      }

      const convertedAmount = amount * rate;

      const result: ExchangeRateResponse = {
        convertedAmount: Math.round(convertedAmount * 100) / 100, // Round to 2 decimals
        rate,
        targetCurrency: 'BRL',
        providerMeta: {
          baseCurrency: fromCurrency,
          timestamp: new Date().toISOString(),
        },
      };

      this.logger.log(
        `Conversion successful: ${amount} ${fromCurrency} = ${result.convertedAmount} BRL (rate: ${rate})`,
      );

      return result;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // API responded with error status
          this.logger.error(
            `Exchange API error: ${error.response.status} - ${error.response.statusText}`,
          );
          throw new HttpException(
            `Exchange API error: ${error.response.statusText}`,
            HttpStatus.BAD_GATEWAY,
          );
        } else if (error.request) {
          // Request made but no response
          this.logger.error('Exchange API timeout or network error');
          throw new HttpException(
            'Exchange API unavailable',
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }
      }

      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Unexpected error in exchange service: ${error.message}`);
      throw new HttpException(
        'Failed to convert currency',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
