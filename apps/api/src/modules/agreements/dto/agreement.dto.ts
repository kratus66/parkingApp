import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MaxLength,
} from 'class-validator';
import { AgreementDiscountType } from '../../../entities/agreement.entity';

export class CreateAgreementDto {
  @ApiProperty({ example: 'Convenio Empresa XYZ' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ example: '900123456-7' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  nit?: string;

  @ApiProperty({ enum: AgreementDiscountType, example: AgreementDiscountType.PERCENT })
  @IsEnum(AgreementDiscountType)
  discountType: AgreementDiscountType;

  @ApiProperty({
    description: 'Porcentaje (0-100) si PERCENT, o monto en COP si FIXED',
    example: 20,
  })
  @IsInt()
  @Min(0)
  discountValue: number;

  @ApiPropertyOptional({
    description: 'Parqueadero específico; omitir para aplicar a todos',
  })
  @IsUUID()
  @IsOptional()
  parkingLotId?: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsString()
  @IsOptional()
  validFrom?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsString()
  @IsOptional()
  validUntil?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateAgreementDto extends PartialType(CreateAgreementDto) {}
