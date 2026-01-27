import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketTemplate } from '../../entities/ticket-template.entity';
import { CreateTicketTemplateDto } from './dto/create-ticket-template.dto';
import { UpdateTicketTemplateDto } from './dto/update-ticket-template.dto';
import { ParkingSession } from '../parking-sessions/entities/parking-session.entity';

@Injectable()
export class TicketTemplatesService {
  constructor(
    @InjectRepository(TicketTemplate)
    private ticketTemplateRepository: Repository<TicketTemplate>,
  ) {}

  async create(companyId: string, createDto: CreateTicketTemplateDto): Promise<TicketTemplate> {
    const template = this.ticketTemplateRepository.create({
      ...createDto,
      companyId,
    });

    if (createDto.isDefault) {
      await this.ticketTemplateRepository.update(
        { parkingLotId: createDto.parkingLotId },
        { isDefault: false },
      );
    }

    return this.ticketTemplateRepository.save(template);
  }

  async findAll(parkingLotId: string): Promise<TicketTemplate[]> {
    return this.ticketTemplateRepository.find({
      where: { parkingLotId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<TicketTemplate> {
    return this.ticketTemplateRepository.findOneOrFail({ where: { id } });
  }

  async findDefault(parkingLotId: string): Promise<TicketTemplate | null> {
    return this.ticketTemplateRepository.findOne({
      where: { parkingLotId, isDefault: true },
    });
  }

  async update(id: string, updateDto: UpdateTicketTemplateDto): Promise<TicketTemplate> {
    const template = await this.findOne(id);

    if (updateDto.isDefault) {
      await this.ticketTemplateRepository.update(
        { parkingLotId: template.parkingLotId },
        { isDefault: false },
      );
    }

    Object.assign(template, updateDto);
    return this.ticketTemplateRepository.save(template);
  }

  async setDefault(id: string): Promise<TicketTemplate> {
    const template = await this.findOne(id);
    
    await this.ticketTemplateRepository.update(
      { parkingLotId: template.parkingLotId },
      { isDefault: false },
    );

    template.isDefault = true;
    return this.ticketTemplateRepository.save(template);
  }

  async remove(id: string): Promise<void> {
    await this.ticketTemplateRepository.delete(id);
  }

  // Método simplificado para Sprint 4
  async generateTicketContentSimple(
    session: ParkingSession | any,
    spotNumber: string,
    parkingLotId: string,
    vehiclePlate?: string,
    vehicleType?: string,
    checkInTime?: Date
  ): Promise<string> {
    const lines: string[] = [];
    const LINE_WIDTH = 32;
    
    const center = (text: string) => text.padStart((LINE_WIDTH + text.length) / 2).padEnd(LINE_WIDTH);
    const separator = () => '='.repeat(LINE_WIDTH);

    // Header simple
    lines.push(center('TICKET DE PARKING'));
    lines.push(separator());
    lines.push('');

    // Usar parámetros si se proveen, sino usar la entidad
    const plate = vehiclePlate || session.vehiclePlate || session.vehicle?.plate || 'N/A';
    const type = vehicleType || session.vehicleType || session.vehicle?.vehicleType || 'N/A';
    const time = checkInTime || session.checkInTime || session.entryAt || new Date();

    // Información del ticket
    lines.push(`TICKET: ${session.ticketNumber}`);
    lines.push(`FECHA: ${time.toLocaleDateString('es-ES')}`);
    lines.push(`HORA: ${time.toLocaleTimeString('es-ES', { hour12: false })}`);
    lines.push('');
    
    // Información del vehículo
    lines.push(`VEHICULO: ${plate}`);
    lines.push(`TIPO: ${type}`);
    lines.push(`PUESTO: ${spotNumber}`);
    lines.push('');

    // Información de contacto si existe
    if (session.phoneNumber) {
      lines.push(`TEL: ${session.phoneNumber}`);
    }
    if (session.email) {
      lines.push(`EMAIL: ${session.email}`);
    }
    if (session.phoneNumber || session.email) {
      lines.push('');
    }

    // Footer
    lines.push(separator());
    lines.push(center('CONSERVE ESTE TICKET'));
    lines.push('');

    return lines.join('\n');
  }

  private getVehicleTypeLabel(type: string): string {
    const labels = {
      BICYCLE: 'BICICLETA',
      MOTORCYCLE: 'MOTOCICLETA',
      CAR: 'AUTOMOVIL',
      TRUCK: 'CAMION',
    };
    return labels[type] || type;
  }
}
