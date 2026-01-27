import { IsString, IsNotEmpty, IsInt, IsBoolean, IsOptional, IsEnum, IsUUID, Min, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VehicleType, DayType, PeriodType, BillingUnit, RoundingType } from '../../../entities/tariff-rule.entity';

export class CreateTariffRuleDto {
  @ApiProperty()
  @IsUUID()
  companyId: string;

  @ApiProperty()
  @IsUUID()
  parkingLotId: string;

  @ApiProperty()
  @IsUUID()
  tariffPlanId: string;

  @ApiProperty({ enum: VehicleType })
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @ApiProperty({ enum: DayType })
  @IsEnum(DayType)
  dayType: DayType;

  @ApiProperty({ enum: PeriodType })
  @IsEnum(PeriodType)
  period: PeriodType;

  @ApiProperty({ example: '06:00' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  startTime: string;

  @ApiProperty({ example: '18:59' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  endTime: string;

  @ApiProperty({ enum: BillingUnit })
  @IsEnum(BillingUnit)
  billingUnit: BillingUnit;

  @ApiProperty({ example: 3000 })
  @IsInt()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  @Min(0)
  minimumCharge?: number;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  @Min(0)
  dailyMax?: number;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  @Min(0)
  graceMinutes?: number;

  @ApiProperty({ enum: RoundingType, default: RoundingType.CEIL })
  @IsEnum(RoundingType)
  @IsOptional()
  rounding?: RoundingType;

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
