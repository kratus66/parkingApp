import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsentsController } from './consents.controller';
import { ConsentsService } from './consents.service';
import { Consent } from '../../entities/consent.entity';
import { Customer } from '../../entities/customer.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Consent, Customer]), AuditModule],
  controllers: [ConsentsController],
  providers: [ConsentsService],
  exports: [ConsentsService],
})
export class ConsentsModule {}
