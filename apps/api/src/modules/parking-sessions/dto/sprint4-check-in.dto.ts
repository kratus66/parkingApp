import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum VehicleType {
  CAR = 'CAR',
  MOTORCYCLE = 'MOTORCYCLE',
  BICYCLE = 'BICYCLE',
  TRUCK_BUS = 'TRUCK_BUS', // Agregado para compatibilidad
}

export class CheckInDto {
  @ApiProperty({ description: 'ID del parking lot' })
  @IsString()
  @IsNotEmpty()
  parkingLotId: string;

  @ApiProperty({ 
    description: 'Placa del vehículo o código de bicicleta',
    example: 'ABC123'
  })
  @IsString()
  @IsNotEmpty()
  vehiclePlate: string;

  @ApiProperty({ 
    description: 'Tipo de vehículo',
    enum: VehicleType,
    example: VehicleType.CAR
  })
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @ApiPropertyOptional({ description: 'Número de teléfono del cliente' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Email del cliente' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'ID del puesto de estacionamiento (opcional, se asigna automáticamente si no se proporciona)' })
  @IsOptional()
  @IsString()
  parkingSpotId?: string;

  @ApiPropertyOptional({ description: 'Notas adicionales' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Consentimiento para recibir notificaciones por WhatsApp' })
  @IsOptional()
  @IsBoolean()
  whatsappConsent?: boolean;

  @ApiPropertyOptional({ description: 'Consentimiento para recibir notificaciones por Email' })
  @IsOptional()
  @IsBoolean()
  emailConsent?: boolean;
}