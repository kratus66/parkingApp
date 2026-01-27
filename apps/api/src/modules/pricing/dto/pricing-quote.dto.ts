import { IsDateString, IsEnum, IsBoolean, IsOptional, IsUUID, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VehicleType } from '../../../entities/tariff-rule.entity';

export class PricingQuoteDto {
  @ApiProperty()
  @IsUUID()
  parkingLotId: string;

  @ApiProperty({ enum: VehicleType })
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @ApiProperty({ example: '2026-01-21T10:00:00Z' })
  @IsDateString()
  entryAt: string;

  @ApiProperty({ example: '2026-01-21T14:00:00Z' })
  @IsDateString()
  exitAt: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  lostTicket?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  overrideDayType?: string;
}
