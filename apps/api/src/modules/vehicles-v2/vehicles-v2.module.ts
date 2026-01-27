import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiclesV2Controller } from './vehicles-v2.controller';
import { VehiclesV2Service } from './vehicles-v2.service';
import { Vehicle } from '../../entities/vehicle-v2.entity';
import { Customer } from '../../entities/customer.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle, Customer]), AuditModule],
  controllers: [VehiclesV2Controller],
  providers: [VehiclesV2Service],
  exports: [VehiclesV2Service],
})
export class VehiclesV2Module {}
