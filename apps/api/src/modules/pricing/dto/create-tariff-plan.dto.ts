import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTariffPlanDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  parkingLotId: string;

  @ApiProperty({ example: 'Tarifa 2026' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ required: false, default: 'America/Bogota' })
  @IsString()
  @IsOptional()
  timezone?: string;
}
