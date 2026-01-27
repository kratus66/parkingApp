import { PartialType } from '@nestjs/swagger';
import { CreateZoneDto } from './create-zone.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateZoneDto extends PartialType(CreateZoneDto) {
  @ApiProperty({
    description: 'Estado activo de la zona',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
