import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketTemplatesController } from './ticket-templates.controller';
import { TicketTemplatesService } from './ticket-templates.service';
import { TicketTemplate } from '../../entities/ticket-template.entity';

/**
 * (F3/Sprint F) El flujo legacy de tickets (TicketsController/TicketsService, que
 * cobraba con tarifas fijas y usaba vehicles v1) fue retirado. Este módulo conserva
 * solo la gestión de plantillas de ticket (TicketTemplatesService), que usa
 * parking-sessions para renderizar el contenido del ticket en la reimpresión.
 */
@Module({
  imports: [TypeOrmModule.forFeature([TicketTemplate])],
  controllers: [TicketTemplatesController],
  providers: [TicketTemplatesService],
  exports: [TicketTemplatesService],
})
export class TicketsModule {}
