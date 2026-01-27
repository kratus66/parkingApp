import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ParkingSession, ParkingSessionStatus } from '../../entities/parking-session.entity';
import { ParkingSpot, SpotStatus } from '../../entities/parking-spot.entity';
import { Payment, PaymentStatus } from '../../entities/payment.entity';
import { PaymentItem, PaymentMethod } from '../../entities/payment-item.entity';
import { CustomerInvoice, InvoiceStatus } from '../../entities/customer-invoice.entity';
import { CustomerInvoiceItem } from '../../entities/customer-invoice-item.entity';
import { PricingSnapshot } from '../../entities/pricing-snapshot.entity';
import { InvoiceCounter } from '../../entities/invoice-counter.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { AuditAction } from '../audit/enums/audit-action.enum';
import { CashShift, CashShiftStatus } from '../../entities/cash-shift.entity';
import { CashPolicy } from '../../entities/cash-policy.entity';
import { PricingService } from '../pricing/pricing.service';
import { NotificationsService } from '../notifications/notifications.service';
// import { OccupancyGateway } from '../occupancy/occupancy.gateway';
import { CheckoutPreviewDto, CheckoutConfirmDto, PaymentItemDto } from './dto/checkout.dto';
import { InvoiceService } from './invoice.service';

@Injectable()
export class CheckoutService {
  constructor(
    @InjectRepository(ParkingSession)
    private sessionRepo: Repository<ParkingSession>,
    @InjectRepository(ParkingSpot)
    private spotRepo: Repository<ParkingSpot>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(PaymentItem)
    private paymentItemRepo: Repository<PaymentItem>,
    @InjectRepository(CustomerInvoice)
    private invoiceRepo: Repository<CustomerInvoice>,
    @InjectRepository(CustomerInvoiceItem)
    private invoiceItemRepo: Repository<CustomerInvoiceItem>,
    @InjectRepository(PricingSnapshot)
    private snapshotRepo: Repository<PricingSnapshot>,
    @InjectRepository(InvoiceCounter)
    private counterRepo: Repository<InvoiceCounter>,
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
    @InjectRepository(CashShift)
    private cashShiftRepo: Repository<CashShift>,
    @InjectRepository(CashPolicy)
    private cashPolicyRepo: Repository<CashPolicy>,
    private pricingService: PricingService,
    private notificationsService: NotificationsService,
    // TODO: Implement OccupancyGateway
    // private occupancyGateway: OccupancyGateway,
    private invoiceService: InvoiceService,
    private dataSource: DataSource,
  ) {}

  /**
   * PREVIEW: Calcula el monto sin realizar cambios
   */
  async preview(dto: CheckoutPreviewDto, companyId: string, parkingLotId: string, userId: string) {
    const session = await this.sessionRepo.findOne({
      where: {
        id: dto.sessionId,
        companyId,
        parkingLotId,
      },
      relations: ['vehicle', 'customer', 'spot', 'spot.zone'],
    });

    if (!session) {
      throw new NotFoundException('Sesión de parqueo no encontrada');
    }

    if (session.status !== 'ACTIVE') {
      throw new ConflictException('La sesión no está activa');
    }

    const exitAt = new Date();
    const vehicleType = session.vehicle?.vehicleType || 'CAR';

    // Calcular usando PricingEngine
    const quote = await this.pricingService.calculateQuote({
      parkingLotId,
      vehicleType,
      entryAt: session.entryAt.toISOString(),
      exitAt: exitAt.toISOString(),
    }, companyId);

    let total = quote.total;

    // Aplicar cargo por ticket perdido (ejemplo: 20% adicional o mínimo 5000 COP)
    if (dto.lostTicket) {
      const lostTicketFee = Math.max(5000, Math.round(total * 0.2));
      total += lostTicketFee;
      // Lost ticket fee is already calculated by pricing service
    }

    const totalMinutes = Math.round((exitAt.getTime() - session.entryAt.getTime()) / 60000);

    return {
      sessionId: session.id,
      ticketNumber: session.ticketNumber,
      entryAt: session.entryAt,
      exitAt,
      totalMinutes,
      vehicleType,
      quote,
      total,
      customer: session.customer,
      vehicle: session.vehicle,
    };
  }

  /**
   * CONFIRM: Realiza el checkout completo
   */
  async confirm(
    dto: CheckoutConfirmDto,
    companyId: string,
    parkingLotId: string,
    userId: string,
  ) {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Validar sesión
      const session = await manager.findOne(ParkingSession, {
        where: { id: dto.sessionId, companyId, parkingLotId },
        relations: ['vehicle', 'customer', 'spot', 'spot.zone', 'parkingLot'],
      });

      if (!session) {
        throw new NotFoundException('Sesión de parqueo no encontrada');
      }

      if (session.status !== 'ACTIVE') {
        throw new ConflictException('La sesión no está activa');
      }

      // 1b. Validar turno de caja abierto
      const policy = await manager.findOne(CashPolicy, {
        where: { parkingLotId, companyId },
      });

      let cashShiftId: string | null = null;

      if (policy && policy.requireOpenShiftForCheckout) {
        const openShift = await manager.findOne(CashShift, {
          where: {
            parkingLotId,
            cashierUserId: userId,
            status: CashShiftStatus.OPEN,
          },
        });

        if (!openShift) {
          throw new ConflictException(
            'Debe abrir un turno de caja antes de procesar salidas. Vaya a Caja > Abrir Turno.',
          );
        }

        cashShiftId = openShift.id;
      } else {
        // Policy doesn't require or doesn't exist - try to find open shift anyway
        const openShift = await manager.findOne(CashShift, {
          where: {
            parkingLotId,
            cashierUserId: userId,
            status: CashShiftStatus.OPEN,
          },
        });

        if (openShift) {
          cashShiftId = openShift.id;
        }
      }

      const exitAt = new Date();
      const vehicleType = session.vehicle?.vehicleType || 'CAR';

      // 2. Calcular total
      const quote = await this.pricingService.calculateQuote({
        parkingLotId,
        vehicleType,
        entryAt: session.entryAt.toISOString(),
        exitAt: exitAt.toISOString(),
      }, companyId);

      let total = quote.total;

      if (dto.lostTicket) {
        const lostTicketFee = Math.max(5000, Math.round(total * 0.2));
        total += lostTicketFee;
        // Lost ticket fee is already calculated by pricing service
      }

      // 3. Validar suma de pagos
      const paymentTotal = dto.paymentItems.reduce((sum, item) => sum + item.amount, 0);
      if (paymentTotal !== total) {
        throw new BadRequestException(
          `La suma de los pagos (${paymentTotal}) no coincide con el total (${total})`,
        );
      }

      // 4. Validar CASH: receivedAmount >= amount
      dto.paymentItems.forEach((item) => {
        if (item.method === PaymentMethod.CASH) {
          if (!item.receivedAmount || item.receivedAmount < item.amount) {
            throw new BadRequestException(
              `Para pago en efectivo, el monto recibido debe ser mayor o igual al monto a pagar`,
            );
          }
        }
      });

      // 5. Crear PricingSnapshot
      const totalMinutes = Math.round((exitAt.getTime() - session.entryAt.getTime()) / 60000);
      const snapshot = manager.create(PricingSnapshot, {
        companyId,
        parkingLotId,
        parkingSessionId: session.id,
        entryAt: session.entryAt,
        exitAt,
        vehicleType,
        totalMinutes,
        quote,
        total,
      });
      await manager.save(snapshot);

      // 6. Crear Payment
      const payment = manager.create(Payment, {
        companyId,
        parkingLotId,
        parkingSessionId: session.id,
        customerId: session.customerId || undefined,
        totalAmount: total,
        status: PaymentStatus.PAID,
        createdByUserId: userId,
        cashShiftId: cashShiftId || undefined, // Convertir null a undefined
      });
      await manager.save(payment);

      // 7. Crear PaymentItems
      const paymentItems = dto.paymentItems.map((itemDto) => {
        const changeAmount =
          itemDto.method === PaymentMethod.CASH && itemDto.receivedAmount
            ? itemDto.receivedAmount - itemDto.amount
            : null;

        return manager.create(PaymentItem, {
          paymentId: payment.id,
          method: itemDto.method,
          amount: itemDto.amount,
          reference: itemDto.reference || undefined,
          receivedAmount: itemDto.receivedAmount || undefined,
          changeAmount: changeAmount || undefined,
        });
      });
      await manager.save(paymentItems);

      // 8. Generar factura
      const invoiceNumber = await this.getNextInvoiceNumber(parkingLotId, manager);
      const invoice = manager.create(CustomerInvoice, {
        companyId,
        parkingLotId,
        parkingSessionId: session.id,
        customerId: session.customerId || undefined,
        invoiceNumber,
        issuedAt: exitAt,
        subtotal: total,
        discounts: 0,
        total,
        currency: 'COP',
        status: InvoiceStatus.ISSUED,
      });
      await manager.save(invoice);

      // 9. Crear invoice item
      const invoiceItem = manager.create(CustomerInvoiceItem, {
        customerInvoiceId: invoice.id,
        description: 'Servicio de parqueo',
        quantity: 1,
        unitPrice: total,
        total,
      });
      await manager.save(invoiceItem);

      // 10. Cerrar sesión
      const beforeSession = { ...session };
      session.exitAt = exitAt;
      session.status = ParkingSessionStatus.CLOSED;
      session.closedByUserId = userId;
      await manager.save(session);

      // 11. Liberar spot
      const spot = session.spot;
      const beforeSpot = { ...spot };
      spot.status = SpotStatus.FREE;
      // spot.currentSessionId = null; // Property doesn't exist
      await manager.save(spot);

      // 12. AuditLog
      await manager.save(AuditLog, {
        companyId,
        userId,
        action: AuditAction.CHECKOUT_CONFIRM,
        entityType: 'ParkingSession',
        entityId: session.id,
        before: beforeSession,
        after: session,
      });

      await manager.save(AuditLog, {
        companyId,
        userId,
        action: AuditAction.SPOT_RELEASED,
        entityType: 'ParkingSpot',
        entityId: spot.id,
        before: beforeSpot,
        after: spot,
      });

      await manager.save(AuditLog, {
        companyId,
        userId,
        action: AuditAction.PAYMENT_CREATED,
        entityType: 'Payment',
        entityId: payment.id,
        before: null,
        after: payment,
      });

      await manager.save(AuditLog, {
        companyId,
        userId,
        action: AuditAction.INVOICE_ISSUED,
        entityType: 'CustomerInvoice',
        entityId: invoice.id,
        before: null,
        after: invoice,
      });

      // Cargar relaciones completas para respuesta
      const fullInvoice = await manager.findOne(CustomerInvoice, {
        where: { id: invoice.id },
        relations: ['items', 'customer', 'parkingSession', 'parkingSession.vehicle'],
      });

      const fullPayment = await manager.findOne(Payment, {
        where: { id: payment.id },
        relations: ['items'],
      });

      return {
        session,
        payment: fullPayment,
        invoice: fullInvoice,
        snapshot,
      };
    }).then(async (result) => {
      // Post-transacción: emitir eventos y notificaciones
      try {
        // Emitir WebSocket (comentado hasta implementar OccupancyGateway)
        // await this.occupancyGateway.emitSpotUpdated(result.session.spot);
        // await this.occupancyGateway.emitOccupancyUpdated(
        //   result.session.companyId,
        //   result.session.parkingLotId,
        // );

        // Enviar notificaciones
        if (result.session.customer && result.invoice && result.payment) {
          await this.sendCheckoutNotifications(
            result.session,
            result.invoice,
            result.payment,
          );
        }
      } catch (error) {
        console.error('Error en post-checkout actions:', error);
      }

      // Generar HTML imprimible
      const printableHtml = result.invoice 
        ? await this.invoiceService.generateInvoiceHtml(result.invoice.id)
        : null;

      return {
        ...result,
        printableInvoiceHtml: printableHtml,
      };
    });
  }

  /**
   * Obtener siguiente número de factura
   */
  private async getNextInvoiceNumber(
    parkingLotId: string,
    manager: any,
  ): Promise<string> {
    let counter = await manager.findOne(InvoiceCounter, {
      where: { parkingLotId },
    });

    if (!counter) {
      counter = manager.create(InvoiceCounter, {
        parkingLotId,
        counter: 0,
        prefix: 'INV',
      });
    }

    counter.counter += 1;
    await manager.save(counter);

    const paddedNumber = String(counter.counter).padStart(8, '0');
    return `${counter.prefix}-${paddedNumber}`;
  }

  /**
   * Enviar notificaciones de checkout
   */
  private async sendCheckoutNotifications(
    session: ParkingSession,
    invoice: CustomerInvoice,
    payment: Payment,
  ): Promise<void> {
    const customer = session.customer;
    if (!customer) return;

    const message = `
🚗 SALIDA DE PARQUEADERO

Ticket: ${session.ticketNumber}
Vehículo: ${session.vehicle?.plate || session.vehicle?.bicycleCode || 'N/A'}
Entrada: ${session.entryAt.toLocaleString('es-CO')}
Salida: ${session.exitAt?.toLocaleString('es-CO') || 'N/A'}
Total: $${(payment.totalAmount).toLocaleString('es-CO')} COP

Factura: ${invoice.invoiceNumber}

¡Gracias por usar nuestro servicio!
    `.trim();

    // Enviar por canales según consentimiento
    // TODO: Implement sendNotification method
    // await this.notificationsService.sendNotification({
    //   companyId: session.companyId,
    //   customerId: customer.id,
    //   type: 'CHECKOUT',
    //   channel: 'WHATSAPP',
    //   message,
    //   metadata: {
    //     sessionId: session.id,
    //     invoiceId: invoice.id,
    //     paymentId: payment.id,
    //   },
    // });
  }
}
