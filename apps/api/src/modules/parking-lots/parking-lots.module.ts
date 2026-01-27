import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParkingLotsService } from './parking-lots.service';
import { ParkingLotsController } from './parking-lots.controller';
import { ParkingLot } from './entities/parking-lot.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ParkingLot])],
  controllers: [ParkingLotsController],
  providers: [ParkingLotsService],
  exports: [ParkingLotsService],
})
export class ParkingLotsModule {}
