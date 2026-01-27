import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashShift } from '../../entities/cash-shift.entity';
import { CashMovement } from '../../entities/cash-movement.entity';
import { CashCount } from '../../entities/cash-count.entity';
import { CashPolicy } from '../../entities/cash-policy.entity';
import { Payment } from '../../entities/payment.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { ShiftsService } from './services/shifts.service';
import { MovementsService } from './services/movements.service';
import { CountsService } from './services/counts.service';
import { PolicyService } from './services/policy.service';
import { ShiftsController } from './controllers/shifts.controller';
import { MovementsController } from './controllers/movements.controller';
import { CountsController } from './controllers/counts.controller';
import { PolicyController } from './controllers/policy.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CashShift,
      CashMovement,
      CashCount,
      CashPolicy,
      Payment,
      AuditLog,
    ]),
  ],
  controllers: [
    ShiftsController,
    MovementsController,
    CountsController,
    PolicyController,
  ],
  providers: [ShiftsService, MovementsService, CountsService, PolicyService],
  exports: [ShiftsService, PolicyService],
})
export class CashModule {}
