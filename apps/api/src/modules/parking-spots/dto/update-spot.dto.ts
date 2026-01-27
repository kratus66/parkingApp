import { PartialType } from '@nestjs/swagger';
import { CreateSpotDto } from './create-spot.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { SpotStatus } from '../../../entities/parking-spot.entity';

export class UpdateSpotDto extends PartialType(CreateSpotDto) {
  @ApiProperty({
    description: 'Estado del puesto',
    enum: SpotStatus,
    example: SpotStatus.FREE,
    required: false,
  })
  @IsEnum(SpotStatus)
  @IsOptional()
  status?: SpotStatus;
}
