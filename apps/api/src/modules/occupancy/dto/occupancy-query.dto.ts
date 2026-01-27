import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional } from 'class-validator';

export class OccupancyQueryDto {
  @ApiProperty({
    description: 'ID del parqueadero',
    required: true,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  parkingLotId: string;

  @ApiProperty({
    description: 'ID de la zona (opcional, para filtrar por zona)',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsOptional()
  zoneId?: string;
}
