import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParkingSessionsService } from './parking-sessions.service';
import { ParkingSessionsController } from './parking-sessions.controller';
import { ParkingSession } from '../../entities/parking-session.entity';
import { ParkingLotCounter } from '../../entities/parking-lot-counter.entity';
import { TicketPrintLog } from '../../entities/ticket-print-log.entity';
import { OccupancyModule } from '../occupancy/occupancy.module';
import { TicketsModule } from '../tickets/tickets.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditModule } from '../audit/audit.module';
import { VehiclesV2Module } from '../vehicles-v2/vehicles-v2.module';
import { ConsentsModule } from '../consents/consents.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ParkingSession,
      ParkingLotCounter,
      TicketPrintLog,
    ]),
    OccupancyModule,
    TicketsModule,
    NotificationsModule,
    AuditModule,
    VehiclesV2Module,
    ConsentsModule,
  ],
  controllers: [ParkingSessionsController],
  providers: [ParkingSessionsService],
  exports: [ParkingSessionsService],
})
export class ParkingSessionsModule {}
