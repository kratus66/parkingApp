import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsUUID,
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { VehicleType } from '../../../entities/vehicle-v2.entity';

export class CreateVehicleDto {
  @ApiProperty({
    description: 'ID del cliente propietario',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({
    description: 'Tipo de vehículo',
    enum: VehicleType,
    example: VehicleType.CAR,
  })
  @IsEnum(VehicleType)
  @IsNotEmpty()
  vehicleType: VehicleType;

  @ApiProperty({
    description:
      'Placa del vehículo (obligatorio excepto para bicicletas). Se normaliza automáticamente a mayúsculas sin espacios',
    example: 'ABC123',
    required: false,
    maxLength: 20,
  })
  @ValidateIf((o) => o.vehicleType !== VehicleType.BICYCLE)
  @IsString()
  @IsNotEmpty({ message: 'La placa es obligatoria para vehículos motorizados' })
  @MaxLength(20)
  @ValidateIf((o) => o.vehicleType === VehicleType.BICYCLE)
  @IsOptional()
  plate?: string;

  @ApiProperty({
    description: 'Código de bicicleta (obligatorio solo para bicicletas)',
    example: 'BICI-001',
    required: false,
    maxLength: 50,
  })
  @ValidateIf((o) => o.vehicleType === VehicleType.BICYCLE)
  @IsString()
  @IsNotEmpty({ message: 'El código es obligatorio para bicicletas' })
  @MaxLength(50)
  @ValidateIf((o) => o.vehicleType !== VehicleType.BICYCLE)
  @IsOptional()
  bicycleCode?: string;

  @ApiProperty({
    description: 'Marca del vehículo',
    example: 'Toyota',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @ApiProperty({
    description: 'Modelo del vehículo',
    example: 'Corolla',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @ApiProperty({
    description: 'Color del vehículo',
    example: 'Rojo',
    required: false,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @ApiProperty({
    description: 'Notas adicionales',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
