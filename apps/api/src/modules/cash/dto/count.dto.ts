import {
  IsUUID,
  IsEnum,
  IsInt,
  IsOptional,
  IsObject,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CashCountMethod } from '../../../entities/cash-count.entity';

export class CashDenominationDto {
  @ApiProperty({ description: 'Valor de la denominación', example: 50000 })
  @IsInt()
  @Min(0)
  value: number;

  @ApiProperty({ description: 'Cantidad de billetes/monedas', example: 2 })
  @IsInt()
  @Min(0)
  qty: number;
}

export class CashCountDetailsDto {
  @ApiPropertyOptional({
    description: 'Denominaciones de efectivo',
    type: [CashDenominationDto],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CashDenominationDto)
  denominations?: CashDenominationDto[];

  @ApiPropertyOptional({ description: 'Total en monedas', example: 3500 })
  @IsOptional()
  @IsInt()
  @Min(0)
  coinsTotal?: number;

  @ApiPropertyOptional({ description: 'Notas adicionales', example: 'Revisado 2 veces' })
  @IsOptional()
  notes?: string;
}

export class CreateCountDto {
  @ApiProperty({
    description: 'ID del turno',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  cashShiftId: string;

  @ApiProperty({
    description: 'Método de pago contado',
    enum: CashCountMethod,
    example: CashCountMethod.CASH,
  })
  @IsEnum(CashCountMethod)
  method: CashCountMethod;

  @ApiProperty({
    description: 'Monto total contado en COP',
    example: 157500,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  countedAmount: number;

  @ApiPropertyOptional({
    description: 'Detalles del conteo (para efectivo: denominaciones)',
    type: CashCountDetailsDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CashCountDetailsDto)
  details?: CashCountDetailsDto;
}
