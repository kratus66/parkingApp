import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { SpotStatus } from '../../../entities/parking-spot.entity';
import { VehicleType } from '../../../entities/parking-zone.entity';

export class SearchSpotsDto {
  @ApiProperty({
    description: 'ID del parqueadero para filtrar puestos',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  parkingLotId?: string;

  @ApiProperty({
    description: 'ID de la zona para filtrar puestos',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsOptional()
  zoneId?: string;

  @ApiProperty({
    description: 'Estado del puesto',
    enum: SpotStatus,
    required: false,
  })
  @IsEnum(SpotStatus)
  @IsOptional()
  status?: SpotStatus;

  @ApiProperty({
    description: 'Tipo de puesto',
    enum: VehicleType,
    required: false,
  })
  @IsEnum(VehicleType)
  @IsOptional()
  spotType?: VehicleType;

  @ApiProperty({
    description: 'Término de búsqueda (busca en code y notes)',
    required: false,
    example: 'A-0',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Página actual',
    required: false,
    default: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    description: 'Cantidad de registros por página',
    required: false,
    default: 20,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;
}
