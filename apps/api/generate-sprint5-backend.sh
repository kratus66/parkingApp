#!/bin/bash

echo "Generando archivos del Sprint 5 - Motor de Tarifas..."

# Crear DTOs de Pricing
mkdir -p src/modules/pricing/dto

# create-tariff-plan.dto.ts
cat > src/modules/pricing/dto/create-tariff-plan.dto.ts << 'EOF'
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
EOF

# update-tariff-plan.dto.ts
cat > src/modules/pricing/dto/update-tariff-plan.dto.ts << 'EOF'
import { PartialType } from '@nestjs/swagger';
import { CreateTariffPlanDto } from './create-tariff-plan.dto';

export class UpdateTariffPlanDto extends PartialType(CreateTariffPlanDto) {}
EOF

# create-tariff-rule.dto.ts
cat > src/modules/pricing/dto/create-tariff-rule.dto.ts << 'EOF'
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
EOF

# update-tariff-rule.dto.ts
cat > src/modules/pricing/dto/update-tariff-rule.dto.ts << 'EOF'
import { PartialType } from '@nestjs/swagger';
import { CreateTariffRuleDto } from './create-tariff-rule.dto';

export class UpdateTariffRuleDto extends PartialType(CreateTariffRuleDto) {}
EOF

# update-pricing-config.dto.ts
cat > src/modules/pricing/dto/update-pricing-config.dto.ts << 'EOF'
import { IsInt, IsBoolean, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePricingConfigDto {
  @ApiProperty()
  @IsUUID()
  companyId: string;

  @ApiProperty()
  @IsUUID()
  parkingLotId: string;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  @Min(0)
  defaultGraceMinutes?: number;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  @Min(0)
  defaultDailyMax?: number;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  @Min(0)
  lostTicketFee?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  enableDynamicPricing?: boolean;
}
EOF

# pricing-quote.dto.ts
cat > src/modules/pricing/dto/pricing-quote.dto.ts << 'EOF'
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
EOF

echo "✅ DTOs creados"

