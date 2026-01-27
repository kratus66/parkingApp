import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TariffPlan } from '../../entities/tariff-plan.entity';
import { TariffRule } from '../../entities/tariff-rule.entity';
import { PricingConfig } from '../../entities/pricing-config.entity';
import { TariffChangeLog } from '../../entities/tariff-change-log.entity';
import { ParkingSession } from '../../entities/parking-session.entity';
import { HolidaysModule } from '../holidays/holidays.module';
import { PricingEngineService } from './pricing-engine.service';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TariffPlan,
      TariffRule,
      PricingConfig,
      TariffChangeLog,
      ParkingSession,
    ]),
    HolidaysModule,
  ],
  controllers: [PricingController],
  providers: [PricingEngineService, PricingService],
  exports: [PricingEngineService, PricingService],
})
export class PricingModule {}
