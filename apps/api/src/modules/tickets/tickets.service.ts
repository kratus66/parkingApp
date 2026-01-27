import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import {
  Ticket,
  TicketStatus,
  PaymentMethod,
} from '../../entities/ticket.entity';
import { VehiclesService } from '../vehicles/vehicles.service';
import { AuditService } from '../audit/audit.service';
import { User } from '../users/entities/user.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ExitTicketDto } from './dto/exit-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private readonly vehiclesService: VehiclesService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Genera un número de ticket único
   */
  private async generateTicketNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // Contar tickets del día
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const count = await this.ticketRepository.count({
      where: {
        entryTime: Not(IsNull()),
        createdAt: Not(IsNull()),
      },
    });

    const sequence = String(count + 1).padStart(4, '0');
    return `T${year}${month}${day}-${sequence}`;
  }

  /**
   * Calcular el monto a pagar basado en tiempo de estadía
   */
  private calculateAmount(durationMinutes: number): number {
    // Configuración de tarifas (esto debería venir de la configuración del parqueadero)
    const RATE_PER_HOUR = 3000; // $3000 por hora
    const RATE_PER_MINUTE = RATE_PER_HOUR / 60;
    const MIN_CHARGE_MINUTES = 15; // Cobro mínimo 15 minutos

    if (durationMinutes < MIN_CHARGE_MINUTES) {
      durationMinutes = MIN_CHARGE_MINUTES;
    }

    return Math.ceil(durationMinutes * RATE_PER_MINUTE);
  }

  /**
   * Registrar entrada de vehículo
   */
  async entry(createTicketDto: CreateTicketDto, user: User): Promise<Ticket> {
    // Verificar si el vehículo existe o crearlo
    let vehicle;
    try {
      vehicle = await this.vehiclesService.findByLicensePlate(
        createTicketDto.licensePlate,
        user.companyId,
      );
    } catch (error) {
      // Si no existe, lo creamos automáticamente
      vehicle = await this.vehiclesService.create(
        {
          licensePlate: createTicketDto.licensePlate,
          vehicleType: createTicketDto.vehicleType,
          brand: createTicketDto.brand,
          model: createTicketDto.model,
          color: createTicketDto.color,
        },
        user,
      );
    }

    // Verificar si el vehículo está en lista negra
    if (vehicle.isBlacklisted) {
      throw new BadRequestException(
        `El vehículo ${vehicle.licensePlate} está bloqueado: ${vehicle.blacklistReason}`,
      );
    }

    // Verificar si ya tiene un ticket activo
    const activeTicket = await this.ticketRepository.findOne({
      where: {
        vehicleId: vehicle.id,
        status: TicketStatus.ACTIVE,
      },
    });

    if (activeTicket) {
      throw new BadRequestException(
        `El vehículo ${vehicle.licensePlate} ya tiene un ticket activo (${activeTicket.ticketNumber})`,
      );
    }

    // Generar número de ticket
    const ticketNumber = await this.generateTicketNumber();

    // Crear ticket
    const ticket = this.ticketRepository.create({
      ticketNumber,
      vehicleId: vehicle.id,
      parkingLotId: user.parkingLotId,
      entryUserId: user.id,
      entryTime: new Date(),
      status: TicketStatus.ACTIVE,
    });

    const saved = await this.ticketRepository.save(ticket);

    // Registrar auditoría
    await this.auditService.log({
      action: 'CREATE',
      entityType: 'Ticket',
      entityId: saved.id,
      userId: user.id,
      companyId: user.companyId,
      parkingLotId: user.parkingLotId,
      metadata: {
        ticketNumber: saved.ticketNumber,
        licensePlate: vehicle.licensePlate,
        entryTime: saved.entryTime,
      },
    });

    const newTicket = await this.ticketRepository.findOne({
      where: { id: saved.id },
      relations: ['vehicle', 'parkingLot', 'entryUser'],
    });

    return newTicket!;
  }

  /**
   * Registrar salida de vehículo
   */
  async exit(ticketNumber: string, exitDto: ExitTicketDto, user: User): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { ticketNumber, status: TicketStatus.ACTIVE },
      relations: ['vehicle', 'parkingLot', 'entryUser'],
    });

    if (!ticket) {
      throw new NotFoundException(
        `Ticket ${ticketNumber} no encontrado o ya procesado`,
      );
    }

    // Calcular duración y monto
    const exitTime = new Date();
    const durationMs = exitTime.getTime() - ticket.entryTime.getTime();
    const durationMinutes = Math.ceil(durationMs / (1000 * 60));
    const amount = this.calculateAmount(durationMinutes);

    // Actualizar ticket
    ticket.exitTime = exitTime;
    ticket.exitUserId = user.id;
    ticket.parkingDurationMinutes = durationMinutes;
    ticket.amount = amount;
    ticket.paymentMethod = exitDto.paymentMethod;
    ticket.isPaid = exitDto.isPaid || false;
    if (exitDto.isPaid) {
      ticket.paidAt = exitTime;
    }
    ticket.status = TicketStatus.COMPLETED;
    ticket.notes = exitDto.notes || '';

    const saved = await this.ticketRepository.save(ticket);

    // Registrar auditoría
    await this.auditService.log({
      action: 'UPDATE',
      entityType: 'Ticket',
      entityId: saved.id,
      userId: user.id,
      companyId: user.companyId,
      parkingLotId: user.parkingLotId,
      metadata: {
        ticketNumber: saved.ticketNumber,
        licensePlate: ticket.vehicle.licensePlate,
        exitTime: saved.exitTime,
        durationMinutes,
        amount,
        paymentMethod: saved.paymentMethod,
        isPaid: saved.isPaid,
      },
    });

    const result = await this.ticketRepository.findOne({
      where: { id: saved.id },
      relations: ['vehicle', 'parkingLot', 'entryUser', 'exitUser'],
    });

    return result!;
  }

  /**
   * Cancelar un ticket
   */
  async cancel(ticketNumber: string, reason: string, user: User): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { ticketNumber, status: TicketStatus.ACTIVE },
      relations: ['vehicle'],
    });

    if (!ticket) {
      throw new NotFoundException(
        `Ticket ${ticketNumber} no encontrado o ya procesado`,
      );
    }

    ticket.status = TicketStatus.CANCELLED;
    ticket.notes = reason;

    const saved = await this.ticketRepository.save(ticket);

    // Registrar auditoría
    await this.auditService.log({
      action: 'DELETE',
      entityType: 'Ticket',
      entityId: saved.id,
      userId: user.id,
      companyId: user.companyId,
      parkingLotId: user.parkingLotId,
      metadata: {
        ticketNumber: saved.ticketNumber,
        licensePlate: ticket.vehicle.licensePlate,
        reason,
      },
    });

    return saved;
  }

  /**
   * Obtener tickets activos (vehículos en el parqueadero)
   */
  async getActiveTickets(parkingLotId: string): Promise<Ticket[]> {
    return this.ticketRepository.find({
      where: { parkingLotId, status: TicketStatus.ACTIVE },
      relations: ['vehicle', 'entryUser'],
      order: { entryTime: 'DESC' },
    });
  }

  /**
   * Obtener historial de tickets
   */
  async getHistory(
    parkingLotId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Ticket[]> {
    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.vehicle', 'vehicle')
      .leftJoinAndSelect('ticket.entryUser', 'entryUser')
      .leftJoinAndSelect('ticket.exitUser', 'exitUser')
      .where('ticket.parkingLotId = :parkingLotId', { parkingLotId });

    if (startDate) {
      query.andWhere('ticket.entryTime >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('ticket.entryTime <= :endDate', { endDate });
    }

    return query.orderBy('ticket.entryTime', 'DESC').getMany();
  }

  /**
   * Obtener ticket por número
   */
  async findByTicketNumber(ticketNumber: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { ticketNumber },
      relations: ['vehicle', 'parkingLot', 'entryUser', 'exitUser'],
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketNumber} no encontrado`);
    }

    return ticket;
  }

  /**
   * Obtener estadísticas del día
   */
  async getDailyStats(parkingLotId: string): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [active, completed, total, revenue] = await Promise.all([
      this.ticketRepository.count({
        where: {
          parkingLotId,
          status: TicketStatus.ACTIVE,
        },
      }),
      this.ticketRepository.count({
        where: {
          parkingLotId,
          status: TicketStatus.COMPLETED,
          exitTime: Not(IsNull()),
        },
      }),
      this.ticketRepository.count({
        where: {
          parkingLotId,
          entryTime: Not(IsNull()),
        },
      }),
      this.ticketRepository
        .createQueryBuilder('ticket')
        .select('SUM(ticket.amount)', 'total')
        .where('ticket.parkingLotId = :parkingLotId', { parkingLotId })
        .andWhere('ticket.status = :status', { status: TicketStatus.COMPLETED })
        .andWhere('ticket.isPaid = :isPaid', { isPaid: true })
        .andWhere('ticket.exitTime >= :today', { today })
        .andWhere('ticket.exitTime < :tomorrow', { tomorrow })
        .getRawOne(),
    ]);

    return {
      date: today,
      activeTickets: active,
      completedTickets: completed,
      totalTickets: total,
      revenue: parseFloat(revenue?.total || '0'),
    };
  }
}
