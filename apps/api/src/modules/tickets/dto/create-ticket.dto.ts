import { IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VehicleType } from '../../../entities/vehicle.entity';

export class CreateTicketDto {
  @ApiProperty({
    description: 'Placa del vehículo',
    example: 'ABC123',
  })
  @IsString()
  @MaxLength(20)
  licensePlate: string;

  @ApiProperty({
    description: 'Tipo de vehículo',
    enum: VehicleType,
    example: VehicleType.CAR,
  })
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @ApiProperty({
    description: 'Marca del vehículo',
    example: 'Toyota',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  brand?: string;

  @ApiProperty({
    description: 'Modelo del vehículo',
    example: 'Corolla',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  model?: string;

  @ApiProperty({
    description: 'Color del vehículo',
    example: 'Blanco',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  color?: string;
}
