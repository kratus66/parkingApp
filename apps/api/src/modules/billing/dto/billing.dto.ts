import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';

export class UpsertResolutionDto {
  @ApiProperty()
  @IsUUID()
  parkingLotId: string;

  @ApiPropertyOptional({ default: 'FACTURA_VENTA' })
  @IsString()
  @IsOptional()
  @MaxLength(40)
  documentType?: string;

  @ApiPropertyOptional({ example: 'FE' })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  prefix?: string;

  @ApiProperty({ example: '18764003812345', description: 'Número de resolución DIAN' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  resolutionNumber: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  rangeFrom: number;

  @ApiProperty({ example: 5000 })
  @IsInt()
  @Min(1)
  rangeTo: number;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsString()
  @IsOptional()
  validFrom?: string;

  @ApiPropertyOptional({ example: '2027-01-01' })
  @IsString()
  @IsOptional()
  validUntil?: string;

  @ApiPropertyOptional({ description: 'Clave técnica DIAN (para CUFE)' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  technicalKey?: string;

  @ApiPropertyOptional({ default: 2, description: '1 producción, 2 pruebas' })
  @IsInt()
  @IsOptional()
  environment?: number;
}
