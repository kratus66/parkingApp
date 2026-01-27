import { IsEnum, IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../../../entities/ticket.entity';

export class ExitTicketDto {
  @ApiProperty({
    description: 'Método de pago',
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Indica si el ticket fue pagado',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @ApiProperty({
    description: 'Notas adicionales',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
