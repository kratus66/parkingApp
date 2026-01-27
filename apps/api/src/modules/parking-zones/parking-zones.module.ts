import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParkingZone } from '../../entities/parking-zone.entity';
import { ParkingZonesService } from './parking-zones.service';
import { ParkingZonesController } from './parking-zones.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([ParkingZone]), AuditModule],
  controllers: [ParkingZonesController],
  providers: [ParkingZonesService],
  exports: [ParkingZonesService],
})
export class ParkingZonesModule {}
