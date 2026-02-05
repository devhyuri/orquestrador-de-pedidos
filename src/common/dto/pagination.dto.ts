import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PAGINATION_DEFAULTS } from '@common/constants/pagination.constants';

export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Número da página',
    example: PAGINATION_DEFAULTS.PAGE,
    minimum: 1,
    default: PAGINATION_DEFAULTS.PAGE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = PAGINATION_DEFAULTS.PAGE;

  @ApiPropertyOptional({
    description: 'Quantidade de itens por página',
    example: PAGINATION_DEFAULTS.LIMIT,
    minimum: 1,
    maximum: PAGINATION_DEFAULTS.MAX_LIMIT,
    default: PAGINATION_DEFAULTS.LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PAGINATION_DEFAULTS.MAX_LIMIT)
  limit?: number = PAGINATION_DEFAULTS.LIMIT;
}
