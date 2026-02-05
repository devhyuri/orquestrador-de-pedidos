import { IsString, IsNotEmpty, IsEmail, IsArray, ValidateNested, IsNumber, Min, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CustomerDto {
  @ApiProperty({
    description: 'Email do cliente',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Nome do cliente',
    example: 'Ana Silva',
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class ItemDto {
  @ApiProperty({
    description: 'SKU do produto',
    example: 'ABC123',
  })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({
    description: 'Quantidade do item',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  qty: number;

  @ApiProperty({
    description: 'Preço unitário do item',
    example: 59.9,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  unit_price: number;
}

export class WebhookOrderDto {
  @ApiProperty({
    description: 'ID externo do pedido',
    example: 'ext-123',
  })
  @IsString()
  @IsNotEmpty()
  order_id: string;

  @ApiProperty({
    description: 'Dados do cliente',
    type: CustomerDto,
  })
  @ValidateNested()
  @Type(() => CustomerDto)
  customer: CustomerDto;

  @ApiProperty({
    description: 'Lista de itens do pedido',
    type: [ItemDto],
    minItems: 1,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items: ItemDto[];

  @ApiProperty({
    description: 'Moeda do pedido (código ISO de 3 letras maiúsculas)',
    example: 'USD',
    pattern: '^[A-Z]{3}$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{3}$/, {
    message: 'currency must be a valid ISO 4217 currency code (3 uppercase letters)',
  })
  currency: string;

  @ApiProperty({
    description: 'Chave de idempotência para garantir que o mesmo pedido não seja processado duas vezes',
    example: 'unique-key-123',
  })
  @IsString()
  @IsNotEmpty()
  idempotency_key: string;
}
