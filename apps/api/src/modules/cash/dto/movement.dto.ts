import {
  IsUUID,
  IsEnum,
  IsInt,
  IsString,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CashMovementType, CashMovementCategory } from '../../../entities/cash-movement.entity';

export class CreateMovementDto {
  @ApiProperty({
    description: 'ID del turno',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  cashShiftId: string;

  @ApiProperty({
    description: 'Tipo de movimiento',
    enum: CashMovementType,
    example: CashMovementType.EXPENSE,
  })
  @IsEnum(CashMovementType)
  type: CashMovementType;

  @ApiProperty({
    description: 'Categoría del movimiento',
    enum: CashMovementCategory,
    example: CashMovementCategory.SUPPLIES,
  })
  @IsEnum(CashMovementCategory)
  category: CashMovementCategory;

  @ApiProperty({
    description: 'Monto en COP',
    example: 15000,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiProperty({
    description: 'Descripción del movimiento',
    example: 'Compra de tintas para impresora',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  description: string;

  @ApiPropertyOptional({
    description: 'Referencia o número de soporte',
    example: 'FAC-2024-001',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;
}
