import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { ParkingLotsModule } from './modules/parking-lots/parking-lots.module';
import { AuditModule } from './modules/audit/audit.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { TicketsModule } from './modules/tickets/tickets.module';
// Sprint 2 modules
import { CustomersModule } from './modules/customers/customers.module';
import { VehiclesV2Module } from './modules/vehicles-v2/vehicles-v2.module';
import { ConsentsModule } from './modules/consents/consents.module';
import { OpsModule } from './modules/ops/ops.module';
// Sprint 3 modules
import { ParkingZonesModule } from './modules/parking-zones/parking-zones.module';
import { ParkingSpotsModule } from './modules/parking-spots/parking-spots.module';
import { OccupancyModule } from './modules/occupancy/occupancy.module';
// Sprint 4 modules
import { ParkingSessionsModule } from './modules/parking-sessions/parking-sessions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
// Sprint 5 modules
import { HolidaysModule } from './modules/holidays/holidays.module';
import { PricingModule } from './modules/pricing/pricing.module';
// Sprint 6 modules
import { CheckoutModule } from './modules/checkout/checkout.module';
import { PaymentsModule } from './modules/payments/payments.module';
// Sprint 7 modules
import { CashModule } from './modules/cash/cash.module';
// import { RealtimeModule } from './modules/realtime/realtime.module'; // Temporalmente comentado
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    ParkingLotsModule,
    AuditModule,
    VehiclesModule,
    TicketsModule,
    // Sprint 2
    CustomersModule,
    VehiclesV2Module,
    ConsentsModule,
    OpsModule,
    // Sprint 3
    ParkingZonesModule,
    ParkingSpotsModule,
    OccupancyModule,
    // Sprint 4
    ParkingSessionsModule,
    NotificationsModule,
    // Sprint 5
    HolidaysModule,
    PricingModule,
    // Sprint 6
    CheckoutModule,
    PaymentsModule,
    // Sprint 7
    CashModule,
    // RealtimeModule, // Temporalmente comentado
  ],
  controllers: [HealthController],
})
export class AppModule {}
