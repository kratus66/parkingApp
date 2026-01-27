import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OccupancyService } from './occupancy.service';
import { OccupancyController } from './occupancy.controller';
import { ParkingSpot } from '../../entities/parking-spot.entity';
import { ParkingZone } from '../../entities/parking-zone.entity';
import { SpotStatusHistory } from '../../entities/spot-status-history.entity';
import { AuditModule } from '../audit/audit.module';
// import { RealtimeModule } from '../realtime/realtime.module'; // Temporalmente comentado

@Module({
  imports: [
    TypeOrmModule.forFeature([ParkingSpot, ParkingZone, SpotStatusHistory]),
    AuditModule,
    // forwardRef(() => RealtimeModule), // Temporalmente comentado
  ],
  controllers: [OccupancyController],
  providers: [OccupancyService],
  exports: [OccupancyService],
})
export class OccupancyModule {}
