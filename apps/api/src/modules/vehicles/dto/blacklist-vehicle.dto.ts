import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BlacklistVehicleDto {
  @ApiProperty({
    description: 'Razón por la cual se bloquea el vehículo',
    example: 'Comportamiento inapropiado',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
