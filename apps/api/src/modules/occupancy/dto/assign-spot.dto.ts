import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class AssignSpotDto {
  @ApiProperty({
    description: 'ID del parqueadero',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  parkingLotId: string;

  @ApiProperty({
    description: 'Tipo de vehículo para asignar',
    enum: ['BICYCLE', 'MOTORCYCLE', 'CAR', 'TRUCK_BUS'],
    example: 'CAR',
  })
  @IsNotEmpty()
  vehicleType: 'BICYCLE' | 'MOTORCYCLE' | 'CAR' | 'TRUCK_BUS';
}
