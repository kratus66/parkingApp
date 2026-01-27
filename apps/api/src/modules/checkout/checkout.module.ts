import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { ParkingSession } from '../../entities/parking-session.entity';
import { ParkingSpot } from '../../entities/parking-spot.entity';
import { Payment } from '../../entities/payment.entity';
import { PaymentItem } from '../../entities/payment-item.entity';
import { CustomerInvoice } from '../../entities/customer-invoice.entity';
import { CustomerInvoiceItem } from '../../entities/customer-invoice-item.entity';
import { PricingSnapshot } from '../../entities/pricing-snapshot.entity';
import { InvoiceCounter } from '../../entities/invoice-counter.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { NotificationLog } from '../../entities/notification-log.entity';
import { Customer } from '../../entities/customer.entity';
import { ParkingZone } from '../../entities/parking-zone.entity';
import { ParkingLot } from '../parking-lots/entities/parking-lot.entity';
import { CashShift } from '../../entities/cash-shift.entity';
import { CashPolicy } from '../../entities/cash-policy.entity';
import { PricingModule } from '../pricing/pricing.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OccupancyModule } from '../occupancy/occupancy.module';
import { InvoiceService } from './invoice.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ParkingSession,
      ParkingSpot,
      Payment,
      PaymentItem,
      CustomerInvoice,
      CustomerInvoiceItem,
      PricingSnapshot,
      InvoiceCounter,
      AuditLog,
      NotificationLog,
      Customer,
      ParkingZone,
      ParkingLot,
      CashShift,
      CashPolicy,
    ]),
    PricingModule,
    NotificationsModule,
    OccupancyModule,
  ],
  controllers: [CheckoutController],
  providers: [CheckoutService, InvoiceService],
  exports: [CheckoutService, InvoiceService],
})
export class CheckoutModule {}
