import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParkingSpotsService } from './parking-spots.service';
import { ParkingSpotsController } from './parking-spots.controller';
import { ParkingSpot } from '../../entities/parking-spot.entity';
import { ParkingZone } from '../../entities/parking-zone.entity';
import { SpotStatusHistory } from '../../entities/spot-status-history.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ParkingSpot, ParkingZone, SpotStatusHistory]),
    AuditModule,
  ],
  controllers: [ParkingSpotsController],
  providers: [ParkingSpotsService],
  exports: [ParkingSpotsService],
})
export class ParkingSpotsModule {}
