import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { ListOrdersResponseDto } from './dto/list-orders-response.dto';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar pedidos',
    description: 'Retorna uma lista paginada de pedidos, com filtro opcional por status',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de pedidos retornada com sucesso',
    type: ListOrdersResponseDto,
  })
  async list(@Query() query: ListOrdersQueryDto) {
    return this.ordersService.list(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obter detalhes de um pedido',
    description: 'Retorna os detalhes completos de um pedido específico, incluindo payload original e dados de enriquecimento',
  })
  @ApiParam({
    name: 'id',
    description: 'ID interno do pedido (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Pedido encontrado',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Pedido não encontrado',
  })
  async findOne(@Param('id') id: string): Promise<OrderResponseDto> {
    return this.ordersService.findById(id);
  }
}
