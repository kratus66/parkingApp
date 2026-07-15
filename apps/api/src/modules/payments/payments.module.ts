import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Payment } from '../../entities/payment.entity';
import { PaymentItem } from '../../entities/payment-item.entity';
import { CashShift } from '../../entities/cash-shift.entity';
import { CashMovement } from '../../entities/cash-movement.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      PaymentItem,
      CashShift,
      CashMovement,
      AuditLog,
    ]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
