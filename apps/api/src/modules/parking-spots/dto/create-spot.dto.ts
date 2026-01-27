import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  Min,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { VehicleType } from '../../../entities/parking-zone.entity';

export class CreateSpotDto {
  @ApiProperty({
    description: 'ID del parqueadero',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  parkingLotId: string;

  @ApiProperty({
    description: 'ID de la zona a la que pertenece el puesto',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsNotEmpty()
  zoneId: string;

  @ApiProperty({
    description: 'Código identificador del puesto',
    example: 'A-01',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({
    description: 'Tipo de vehículo que acepta el puesto',
    enum: VehicleType,
    example: VehicleType.CAR,
  })
  @IsEnum(VehicleType)
  @IsNotEmpty()
  spotType: VehicleType;

  @ApiProperty({
    description: 'Prioridad para asignación automática (mayor = más prioridad)',
    example: 0,
    required: false,
    default: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  priority?: number;

  @ApiProperty({
    description: 'Notas o comentarios sobre el puesto',
    example: 'Cerca de la entrada principal',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
