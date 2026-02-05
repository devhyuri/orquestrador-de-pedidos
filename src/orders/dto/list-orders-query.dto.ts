import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@common/enums/order-status.enum';
import { PaginationDto } from '@common/dto/pagination.dto';

export class ListOrdersQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filtrar pedidos por status',
    enum: OrderStatus,
    example: OrderStatus.ENRICHED,
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
