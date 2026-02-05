import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface CepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
}

@Injectable()
export class CepService {
  private readonly logger = new Logger(CepService.name);
  private readonly httpClient: AxiosInstance;
  private readonly apiUrl: string;
  private readonly timeout: number;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('cep.apiUrl') || 'https://viacep.com.br/ws';
    this.timeout = this.configService.get<number>('cep.timeout') || 5000;

    this.httpClient = axios.create({
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async validateCep(cep: string): Promise<CepResponse> {
    try {
      // Remove formatação do CEP
      const cleanCep = cep.replace(/\D/g, '');

      // Valida formato (8 dígitos)
      if (cleanCep.length !== 8) {
        throw new HttpException(
          'CEP must contain exactly 8 digits',
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(`Validating CEP: ${cleanCep}`);

      const response = await this.httpClient.get<CepResponse>(
        `${this.apiUrl}/${cleanCep}/json`,
      );

      // ViaCEP retorna erro quando CEP não existe
      if (response.data.erro === true) {
        throw new HttpException(
          `CEP ${cleanCep} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Valida se retornou dados válidos
      if (!response.data.cep) {
        throw new HttpException(
          'Invalid response from CEP API',
          HttpStatus.BAD_GATEWAY,
        );
      }

      this.logger.log(
        `CEP validated successfully: ${cleanCep} - ${response.data.logradouro}, ${response.data.localidade}/${response.data.uf}`,
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // API responded with error status
          this.logger.error(
            `CEP API error: ${error.response.status} - ${error.response.statusText}`,
          );
          throw new HttpException(
            `CEP API error: ${error.response.statusText}`,
            HttpStatus.BAD_GATEWAY,
          );
        } else if (error.request) {
          this.logger.error('CEP API timeout or network error');
          throw new HttpException(
            'CEP API unavailable',
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }
      }

      if (error instanceof HttpException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Unexpected error in CEP service: ${errorMessage}`);
      throw new HttpException(
        'Failed to validate CEP',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
