import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpsController } from './ops.controller';
import { OpsService } from './ops.service';
import { CustomersModule } from '../customers/customers.module';
import { VehiclesV2Module } from '../vehicles-v2/vehicles-v2.module';
import { ParkingSession } from '../../entities/parking-session.entity';
import { ParkingSpot } from '../../entities/parking-spot.entity';
import { ParkingZone } from '../../entities/parking-zone.entity';
import { Ticket } from '../../entities/ticket.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ParkingSession,
      ParkingSpot,
      ParkingZone,
      Ticket,
    ]),
    CustomersModule,
    VehiclesV2Module,
  ],
  controllers: [OpsController],
  providers: [OpsService],
})
export class OpsModule {}
