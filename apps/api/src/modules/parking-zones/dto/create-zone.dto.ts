import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  IsEnum,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { VehicleType } from '../../../entities/parking-zone.entity';

export class CreateZoneDto {
  @ApiProperty({
    description: 'ID del parqueadero',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  parkingLotId: string;

  @ApiProperty({
    description: 'Nombre de la zona',
    example: 'Zona A - Carros',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Descripción de la zona',
    example: 'Zona techada para vehículos pequeños',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Tipos de vehículos permitidos en esta zona',
    enum: VehicleType,
    isArray: true,
    example: [VehicleType.CAR, VehicleType.MOTORCYCLE],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe especificar al menos un tipo de vehículo permitido' })
  @IsEnum(VehicleType, { each: true })
  allowedVehicleTypes: VehicleType[];
}
