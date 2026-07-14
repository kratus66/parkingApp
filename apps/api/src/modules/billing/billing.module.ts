import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingResolution } from '../../entities/billing-resolution.entity';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { FiscalService } from './fiscal.service';

@Module({
  imports: [TypeOrmModule.forFeature([BillingResolution])],
  controllers: [BillingController],
  providers: [BillingService, FiscalService],
  exports: [BillingService, FiscalService],
})
export class BillingModule {}
