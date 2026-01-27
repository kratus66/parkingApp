import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { TicketTemplatesController } from './ticket-templates.controller';
import { TicketTemplatesService } from './ticket-templates.service';
import { Ticket } from '../../entities/ticket.entity';
import { TicketTemplate } from '../../entities/ticket-template.entity';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, TicketTemplate]),
    VehiclesModule,
    AuditModule,
  ],
  controllers: [TicketsController, TicketTemplatesController],
  providers: [TicketsService, TicketTemplatesService],
  exports: [TicketsService, TicketTemplatesService],
})
export class TicketsModule {}
