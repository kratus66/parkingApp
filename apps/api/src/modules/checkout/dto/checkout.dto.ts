import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaymentMethod } from '../../../entities/payment-item.entity';

export class PaymentItemDto {
  @ApiProperty({
    description: 'Método de pago',
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
  })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  method: PaymentMethod;

  @ApiProperty({
    description: 'Monto en COP (pesos colombianos)',
    example: 5000,
  })
  @IsInt()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Referencia o número de voucher (opcional)',
    example: 'VOUCHER-123456',
    required: false,
  })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiProperty({
    description: 'Monto recibido del cliente (solo para CASH)',
    example: 10000,
    required: false,
  })
  @IsInt()
  @IsOptional()
  receivedAmount?: number;
}

export class CheckoutPreviewDto {
  @ApiProperty({
    description: 'ID de la sesión de parqueo activa',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    description: 'Indica si se perdió el ticket (aplica cargo adicional)',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  lostTicket?: boolean;
}

export class CheckoutConfirmDto {
  @ApiProperty({
    description: 'ID de la sesión de parqueo activa',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    description: 'Indica si se perdió el ticket (aplica cargo adicional)',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  lostTicket?: boolean;

  @ApiProperty({
    description: 'Items de pago (puede ser pago mixto)',
    type: [PaymentItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentItemDto)
  paymentItems: PaymentItemDto[];
}

export class VoidReasonDto {
  @ApiProperty({
    description: 'Razón de anulación (obligatoria)',
    example: 'Error en el cobro, cliente no estaba conforme',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
