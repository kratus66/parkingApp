import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';
import { SpotStatus } from '../../../entities/parking-spot.entity';

export class ChangeSpotStatusDto {
  @ApiProperty({
    description: 'Nuevo estado del puesto',
    enum: SpotStatus,
    example: SpotStatus.OCCUPIED,
  })
  @IsEnum(SpotStatus)
  @IsNotEmpty()
  toStatus: SpotStatus;

  @ApiProperty({
    description: 'Razón del cambio de estado',
    example: 'Mantenimiento programado',
    required: false,
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;
}
