import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateVehicleDto } from './create-vehicle.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {
  @ApiProperty({
    description: 'Estado activo/inactivo del vehículo',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
