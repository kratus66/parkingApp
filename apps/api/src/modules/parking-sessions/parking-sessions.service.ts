import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { ParkingSession, ParkingSessionStatus } from '../../entities/parking-session.entity';
import { ParkingLotCounter } from '../../entities/parking-lot-counter.entity';
import { TicketPrintLog, TicketPrintAction } from '../../entities/ticket-print-log.entity';
import { Customer } from '../../entities/customer.entity';
import { ParkingLot } from '../parking-lots/entities/parking-lot.entity';
import { Vehicle } from '../../entities/vehicle-v2.entity';
import { TicketTemplatesService } from '../tickets/ticket-templates.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OccupancyService } from '../occupancy/occupancy.service';
import { VehiclesV2Service } from '../vehicles-v2/vehicles-v2.service';
import { CheckInDto, VehicleType } from './dto/sprint4-check-in.dto';
import { ReprintTicketDto } from './dto/reprint-ticket.dto';
import { CancelSessionDto } from './dto/cancel-session.dto';
import { CustomerInvoice } from '../../entities/customer-invoice.entity';
import { User } from '../users/entities/user.entity';
import { AuditService } from '../audit/audit.service';
import { ConsentsService } from '../consents/consents.service';
import { ConsentChannel, ConsentStatus, ConsentSource } from '../../entities/consent.entity';
import { CashPolicy } from '../../entities/cash-policy.entity';
import { CashShift, CashShiftStatus } from '../../entities/cash-shift.entity';

@Injectable()
export class ParkingSessionsService {
  constructor(
    @InjectRepository(ParkingSession)
    private parkingSessionsRepository: Repository<ParkingSession>,
    @InjectRepository(ParkingLotCounter)
    private countersRepository: Repository<ParkingLotCounter>,
    @InjectRepository(TicketPrintLog)
    private printLogsRepository: Repository<TicketPrintLog>,
    @InjectRepository(CustomerInvoice)
    private invoiceRepository: Repository<CustomerInvoice>,
    private dataSource: DataSource,
    private ticketTemplatesService: TicketTemplatesService,
    private notificationsService: NotificationsService,
    private occupancyService: OccupancyService,
    private vehiclesV2Service: VehiclesV2Service,
    private auditService: AuditService,
    private consentsService: ConsentsService,
  ) {}

  async checkIn(checkInDto: CheckInDto, operator: User) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Validar placa
      if (!checkInDto.vehiclePlate) {
        throw new BadRequestException('La placa del vehículo es obligatoria');
      }

      // 2. Buscar vehículo existente por placa
      let vehicle = await this.vehiclesV2Service.findByPlate(
        checkInDto.vehiclePlate,
        operator.companyId,
      );

      // Si no existe el vehículo, lanzar error (debe registrarse primero)
      if (!vehicle) {
        throw new BadRequestException(
          `El vehículo con placa ${checkInDto.vehiclePlate} no está registrado. Por favor, regístrelo primero.`,
        );
      }

      // 2.5. Verificar si el vehículo ya tiene una sesión activa
      const existingActiveSession = await this.parkingSessionsRepository.findOne({
        where: {
          vehicleId: vehicle.id,
          parkingLotId: checkInDto.parkingLotId,
          status: ParkingSessionStatus.ACTIVE,
        },
        relations: ['spot'],
      });

      if (existingActiveSession) {
        throw new BadRequestException(
          `El vehículo con placa ${checkInDto.vehiclePlate} ya tiene una sesión activa en el parqueadero (Ticket #${existingActiveSession.ticketNumber}, Puesto: ${existingActiveSession.spot?.code || 'N/A'}). Por favor, registre la salida antes de crear una nueva entrada.`,
        );
      }

      // 2.6. Validar que existe un turno de caja abierto (si la política lo requiere)
      // (E6/H13) Usa su propio flag `requireOpenShiftForCheckIn` (antes reutilizaba
      // `requireOpenShiftForCheckout`, cuyo nombre solo hablaba del checkout).
      const policy = await queryRunner.manager.findOne(CashPolicy, {
        where: { parkingLotId: checkInDto.parkingLotId, companyId: operator.companyId },
      });

      if (policy && policy.requireOpenShiftForCheckIn) {
        const openShift = await queryRunner.manager.findOne(CashShift, {
          where: {
            parkingLotId: checkInDto.parkingLotId,
            cashierUserId: operator.id,
            status: CashShiftStatus.OPEN,
          },
        });

        if (!openShift) {
          throw new BadRequestException(
            'Debe abrir un turno de caja antes de registrar vehículos. Vaya a Caja > Abrir Turno.',
          );
        }
      }

      // 3. Buscar o validar el espacio de estacionamiento
      let availableSpot;
      
      if (checkInDto.parkingSpotId) {
        // (H6/Sprint D) Validar el puesto solicitado con lock pesimista dentro de la
        // transacción, para que dos entradas concurrentes no tomen el mismo puesto.
        const requestedSpot = await this.occupancyService.findSpotByIdLocked(
          checkInDto.parkingSpotId,
          queryRunner,
        );

        if (!requestedSpot) {
          throw new BadRequestException('El puesto de estacionamiento especificado no existe');
        }

        if (requestedSpot.status !== 'FREE') {
          throw new BadRequestException(`El puesto ${requestedSpot.code} no está disponible`);
        }

        // Validar que el tipo de puesto coincide con el tipo de vehículo
        if (requestedSpot.spotType !== vehicle.vehicleType) {
          throw new BadRequestException(
            `El puesto ${requestedSpot.code} es para vehículos tipo ${requestedSpot.spotType}, no ${vehicle.vehicleType}`
          );
        }

        availableSpot = requestedSpot;
      } else {
        // (H6/Sprint D) Asignación automática con lock pesimista dentro de la transacción.
        availableSpot = await this.occupancyService.findAvailableSpotLocked(
          checkInDto.parkingLotId,
          vehicle.vehicleType,
          queryRunner,
        );

        if (!availableSpot) {
          throw new BadRequestException(
            `No hay espacios disponibles para vehículos tipo ${vehicle.vehicleType}`,
          );
        }
      }

      // 4. Obtener el siguiente número de ticket
      const ticketNumber = await this.getNextTicketNumber(
        checkInDto.parkingLotId,
        queryRunner,
      );

      // 5. Crear la sesión de parking con los campos correctos de la entidad
      const session = this.parkingSessionsRepository.create({
        companyId: operator.companyId,
        parkingLotId: checkInDto.parkingLotId,
        customerId: vehicle.customerId, // Del vehículo encontrado
        vehicleId: vehicle.id, // UUID del vehículo
        spotId: availableSpot.id,
        ticketNumber,
        entryAt: new Date(),
        status: ParkingSessionStatus.ACTIVE,
        createdByUserId: operator.id,
        ticketReprintedCount: 0,
      });

      const savedSession = await queryRunner.manager.save(session);

      // 6. Marcar el espacio como ocupado
      await this.occupancyService.occupySpot(
        availableSpot.id,
        savedSession.id,
        queryRunner,
      );

      // 7. Generar contenido del ticket (TODO: adaptar para nueva entidad)
      const ticketContent = `TICKET: ${savedSession.ticketNumber}\nESPACIO: ${availableSpot.code}\nFECHA: ${new Date().toLocaleString('es-ES')}`;

      // 8. Registrar impresión del ticket
      await this.logTicketPrint(
        operator.companyId,
        checkInDto.parkingLotId,
        savedSession.id,
        ticketContent,
        TicketPrintAction.PRINT,
        operator.id,
        queryRunner,
      );

      // 9. Obtener datos completos para el ticket (antes de commit)
      const customer = vehicle.customerId ? await queryRunner.manager.findOne(Customer, {
        where: { id: vehicle.customerId }
      }) : null;

      const parkingLot = await queryRunner.manager.findOne(ParkingLot, {
        where: { id: checkInDto.parkingLotId }
      });

      // 10. Commit de la transacción
      await queryRunner.commitTransaction();

      // 11. Enviar notificaciones si hay datos de contacto (después de commit)
      if (checkInDto.phoneNumber || checkInDto.email) {
        try {
          // Enviar notificación con contenido del ticket
          const ticketContent = `Ticket: ${savedSession.ticketNumber}\nPuesto: ${availableSpot.code}`;
          await this.notificationsService.sendCheckInNotification(
            savedSession, 
            ticketContent,
            vehicle.plate,
            savedSession.entryAt
          );
        } catch (error) {
          console.error('Error enviando notificaciones:', error);
          // No fallar el check-in si falla la notificación
        }
      }

      // 12. Guardar consentimientos si fueron proporcionados (después de commit)
      if (vehicle.customerId) {
        if (checkInDto.whatsappConsent && checkInDto.phoneNumber) {
          try {
            await this.consentsService.create({
              customerId: vehicle.customerId,
              channel: ConsentChannel.WHATSAPP,
              status: ConsentStatus.GRANTED,
              source: ConsentSource.WEB,
              evidenceText: `Consentimiento otorgado durante check-in por operador ${operator.fullName}`,
            }, operator);
          } catch (error) {
            console.error('Error guardando consentimiento WhatsApp:', error);
          }
        }

        if (checkInDto.emailConsent && checkInDto.email) {
          try {
            await this.consentsService.create({
              customerId: vehicle.customerId,
              channel: ConsentChannel.EMAIL,
              status: ConsentStatus.GRANTED,
              source: ConsentSource.WEB,
              evidenceText: `Consentimiento otorgado durante check-in por operador ${operator.fullName}`,
            }, operator);
          } catch (error) {
            console.error('Error guardando consentimiento Email:', error);
          }
        }
      }

      // 13. Registrar en AuditLog (después de commit)
      await this.auditService.log({
        action: 'PARKING_SESSION_CREATED',
        entityType: 'ParkingSession',
        entityId: savedSession.id,
        userId: operator.id,
        companyId: operator.companyId,
        metadata: {
          ticketNumber: savedSession.ticketNumber,
          vehicleId: vehicle.id,
          vehiclePlate: vehicle.plate || vehicle.bicycleCode,
          spotId: availableSpot.id,
          spotCode: availableSpot.code,
        },
      });

      // 14. Devolver datos completos del ticket
      const ticketResponse = {
        session: savedSession,
        ticket: {
          ticketNumber: savedSession.ticketNumber,
          entryAt: savedSession.entryAt,
          spot: {
            code: availableSpot.code,
            type: availableSpot.spotType,
          },
          vehicle: {
            plate: vehicle.plate,
            bicycleCode: vehicle.bicycleCode,
            vehicleType: vehicle.vehicleType,
            brand: vehicle.brand,
            model: vehicle.model,
            color: vehicle.color,
          },
          customer: customer ? {
            fullName: customer.fullName,
            documentType: customer.documentType,
            documentNumber: customer.documentNumber,
            phone: customer.phone,
            email: customer.email,
          } : null,
          parkingLot: parkingLot ? {
            name: parkingLot.name,
            address: parkingLot.address,
          } : null,
        },
      };

      return ticketResponse;
    } catch (error) {
      // Solo hacer rollback si la transacción está activa
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      // Liberar el query runner solo si no ha sido liberado
      if (!queryRunner.isReleased) {
        await queryRunner.release();
      }
    }
  }

  async reprintTicket(reprintDto: ReprintTicketDto, operator: User) {
    try {
      const session = await this.parkingSessionsRepository.findOne({
        where: { id: reprintDto.sessionId },
        relations: ['vehicle', 'vehicle.customer', 'spot', 'spot.zone', 'parkingLot'],
      });

      if (!session) {
        throw new NotFoundException('Sesión no encontrada');
      }

      if (session.status !== ParkingSessionStatus.ACTIVE) {
        throw new BadRequestException('La sesión no está activa');
      }

      // Incrementar contador de reimpresiones
      session.ticketReprintedCount = (session.ticketReprintedCount || 0) + 1;
      await this.parkingSessionsRepository.save(session);

      // Generar contenido del ticket
      const ticketContent = await this.ticketTemplatesService.generateTicketContentSimple(
        session,
        session.spot?.code || 'N/A',
        session.parkingLotId,
        session.vehicle?.plate,
        session.vehicle?.vehicleType,
        session.entryAt,
      );

      // Registrar reimpresión en log
      try {
        await this.printLogsRepository.save({
          companyId: operator.companyId,
          parkingLotId: session.parkingLotId,
          parkingSessionId: session.id,
          action: TicketPrintAction.REPRINT,
          actorUserId: operator.id,
          reason: reprintDto.reason || null,
          printedAt: new Date(),
        });
      } catch (err) {
        console.error('Error saving print log:', err);
        // Continuar aunque falle el log de impresión
      }

      // Registrar en AuditLog
      try {
        await this.auditService.log({
          action: 'REPRINT_TICKET',
          entityType: 'ParkingSession',
          entityId: session.id,
          userId: operator.id,
          companyId: operator.companyId,
          parkingLotId: session.parkingLotId,
          metadata: {
            ticketNumber: session.ticketNumber,
            reason: reprintDto.reason || null,
            reprintCount: session.ticketReprintedCount,
          },
        });
      } catch (err) {
        console.error('Error saving audit log:', err);
        // Continuar aunque falle el audit log
      }

      return {
        data: session,
        ticketContent,
        reprintReason: reprintDto.reason || null,
        reprintCount: session.ticketReprintedCount,
        message: 'Ticket reimpreso exitosamente',
      };
    } catch (error) {
      console.error('Error in reprintTicket:', error);
      throw error;
    }
  }

  async cancelSession(cancelDto: CancelSessionDto, operator: User) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const session = await this.parkingSessionsRepository.findOne({
        where: { id: cancelDto.sessionId },
      });

      if (!session) {
        throw new NotFoundException('Sesión no encontrada');
      }

      if (session.status !== ParkingSessionStatus.ACTIVE) {
        throw new BadRequestException('La sesión no está activa');
      }

      // Actualizar sesión
      session.status = ParkingSessionStatus.CANCELED;
      session.exitAt = new Date();
      session.cancelReason = cancelDto.reason;
      session.canceledByUserId = operator.id;

      await queryRunner.manager.save(session);

      // Liberar el espacio
      if (session.spotId) {
        await this.occupancyService.releaseSpotSimple(session.spotId, queryRunner);
      }

      await queryRunner.commitTransaction();

      // Registrar en AuditLog
      await this.auditService.log({
        action: 'CANCEL_SESSION',
        entityType: 'ParkingSession',
        entityId: session.id,
        userId: operator.id,
        companyId: operator.companyId,
        metadata: {
          ticketNumber: session.ticketNumber,
          reason: cancelDto.reason,
          spotId: session.spotId,
        },
      });

      return session;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // NOTA (Sprint D / H1): el método `checkOut` legacy fue eliminado. Cobraba con
  // tarifas fijas en código (CAR 3000, MOTORCYCLE 2000, BICYCLE 1000, TRUCK_BUS 5000),
  // sin motor de tarifas, sin gracia/convenios, sin IVA/factura, sin Payment y sin caja.
  // La salida con cobro se realiza exclusivamente por CheckoutService (preview/confirm).

  /**
   * Obtener todas las sesiones activas de un parqueadero
   */
  async findAllActive(parkingLotId?: string): Promise<ParkingSession[]> {
    const whereCondition: any = {
      status: ParkingSessionStatus.ACTIVE,
    };
    
    if (parkingLotId) {
      whereCondition.parkingLotId = parkingLotId;
    }
    
    return this.parkingSessionsRepository.find({
      where: whereCondition,
      relations: ['vehicle', 'vehicle.customer', 'spot', 'spot.zone'],
      order: { entryAt: 'DESC' },
    });
  }

  /**
   * Buscar sesión activa por placa de vehículo
   */
  async findActiveByPlate(
    parkingLotId: string,
    plate: string,
    companyId: string,
  ): Promise<ParkingSession | null> {
    // (H4/H12/Sprint D) Buscar el vehículo por placa dentro de la empresa.
    const vehicles = await this.dataSource.manager
      .createQueryBuilder(Vehicle, 'vehicle')
      .where('vehicle.company_id = :companyId', { companyId })
      .andWhere('UPPER(REPLACE(REPLACE(vehicle.plate, \' \', \'\'), \'-\', \'\')) = :plate', {
        plate: plate.toUpperCase().replace(/[\s\-]/g, ''),
      })
      .getMany();

    if (!vehicles || vehicles.length === 0) {
      return null;
    }

    // Buscar sesión activa para cualquiera de esos vehículos (sin depender de que
    // la placa sea única): se prueba vehículo por vehículo en vez de dejar vehicleId
    // en undefined (que devolvía cualquier sesión activa del lote).
    for (const vehicle of vehicles) {
      const session = await this.parkingSessionsRepository.findOne({
        where: {
          vehicleId: vehicle.id,
          parkingLotId,
          companyId,
          status: ParkingSessionStatus.ACTIVE,
        },
        relations: ['vehicle', 'vehicle.customer', 'spot', 'spot.zone'],
      });
      if (session) return session;
    }

    return null;
  }

  async findByTicketNumber(ticketNumber: string, companyId: string) {
    // (H4/Sprint D) Scoping por empresa.
    return this.parkingSessionsRepository.findOne({
      where: { ticketNumber, companyId },
      relations: ['vehicle', 'vehicle.customer', 'spot', 'spot.zone', 'parkingLot'],
    });
  }

  /**
   * Obtener historial de sesiones con filtros y paginación
   */
  async findHistory(options: {
    parkingLotId: string;
    page: number;
    limit: number;
    search?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const { parkingLotId, page, limit, search, status, dateFrom, dateTo } = options;
    
    const query = this.parkingSessionsRepository.createQueryBuilder('session')
      .leftJoinAndSelect('session.vehicle', 'vehicle')
      .leftJoinAndSelect('vehicle.customer', 'customer')
      .leftJoinAndSelect('session.spot', 'spot')
      .leftJoinAndSelect('spot.zone', 'zone')
      .leftJoinAndSelect('session.parkingLot', 'parkingLot')
      .leftJoinAndSelect('session.invoices', 'invoice')
      .where('session.parkingLotId = :parkingLotId', { parkingLotId })
      .andWhere('session.status IN (:...statuses)', { 
        statuses: ['CLOSED', 'CANCELED'] 
      });

    // Filtro por estado específico
    if (status && status !== 'ALL') {
      query.andWhere('session.status = :status', { status });
    }

    // Búsqueda por ticket, placa o cliente
    if (search) {
      query.andWhere(
        '(session.ticketNumber LIKE :search OR vehicle.plate LIKE :search OR vehicle.bicycleCode LIKE :search OR customer.fullName LIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Filtro por rango de fechas
    if (dateFrom) {
      query.andWhere('session.entryAt >= :dateFrom', { dateFrom });
    }
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      query.andWhere('session.entryAt <= :dateTo', { dateTo: endOfDay });
    }

    // Contar total
    const total = await query.getCount();

    // Paginación
    const skip = (page - 1) * limit;
    const sessions = await query
      .orderBy('session.exitAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    return {
      data: sessions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async getNextTicketNumber(
    parkingLotId: string,
    queryRunner?: QueryRunner,
  ): Promise<string> {
    const manager = queryRunner ? queryRunner.manager : this.dataSource.manager;

    // (H6/Sprint D) Lock pesimista sobre la fila del contador para serializar los
    // incrementos concurrentes (evita números de ticket duplicados). Solo aplicable
    // dentro de la transacción del check-in (queryRunner presente).
    let counter = await manager.findOne(ParkingLotCounter, {
      where: { parkingLotId },
      lock: queryRunner ? { mode: 'pessimistic_write' } : undefined,
    });

    if (!counter) {
      counter = manager.create(ParkingLotCounter, {
        parkingLotId,
        nextTicketNumber: 1,
      });
    } else {
      counter.nextTicketNumber++;
    }

    const savedCounter = await manager.save(counter);

    // Formato: YYYYMMDD-XXXX (por ejemplo: 20241215-0001)
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const paddedNumber = savedCounter.nextTicketNumber.toString().padStart(4, '0');

    return `${today}-${paddedNumber}`;
  }

  private async logTicketPrint(
    companyId: string,
    parkingLotId: string,
    parkingSessionId: string,
    ticketContent: string,
    printAction: TicketPrintAction,
    actorUserId: string,
    queryRunner?: QueryRunner,
  ) {
    const manager = queryRunner ? queryRunner.manager : this.dataSource.manager;

    const printLog = manager.create(TicketPrintLog, {
      companyId,
      parkingLotId,
      parkingSessionId,
      action: printAction,
      actorUserId,
      printedAt: new Date(),
    });

    await manager.save(printLog);
  }
}