import { IsUUID, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class IdentifyDto {
  @ApiPropertyOptional({ description: 'Placa del vehículo' })
  @IsOptional()
  @IsString()
  plate?: string;

  @ApiPropertyOptional({ description: 'Código de bicicleta' })
  @IsOptional()
  @IsString()
  bicycleCode?: string;

  @ApiPropertyOptional({ description: 'Tipo de documento', enum: ['CC', 'CE', 'TI', 'PASSPORT'] })
  @IsOptional()
  @IsEnum(['CC', 'CE', 'TI', 'PASSPORT'])
  documentType?: string;

  @ApiPropertyOptional({ description: 'Número de documento' })
  @IsOptional()
  @IsString()
  documentNumber?: string;
}

export class CheckInDto {
  @ApiProperty({ description: 'ID del parqueadero' })
  @IsUUID()
  parkingLotId: string;

  @ApiPropertyOptional({ description: 'Datos de identificación' })
  @IsOptional()
  identify?: IdentifyDto;

  @ApiPropertyOptional({ description: 'ID del cliente (si ya está identificado)' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ description: 'ID del vehículo (si ya está identificado)' })
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiPropertyOptional({ description: 'ID del puesto (opcional, asigna automáticamente si no viene)' })
  @IsOptional()
  @IsUUID()
  spotId?: string;

  @ApiPropertyOptional({ description: 'ID de la plantilla de ticket' })
  @IsOptional()
  @IsUUID()
  templateId?: string;
}
