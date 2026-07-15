import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Payment, PaymentStatus } from '../../entities/payment.entity';
import { PaymentItem, PaymentMethod } from '../../entities/payment-item.entity';
import { CashShift, CashShiftStatus } from '../../entities/cash-shift.entity';
import {
  CashMovement,
  CashMovementType,
  CashMovementCategory,
} from '../../entities/cash-movement.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { AuditAction } from '../audit/enums/audit-action.enum';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(PaymentItem)
    private paymentItemRepo: Repository<PaymentItem>,
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
    private dataSource: DataSource,
  ) {}

  /**
   * Listar pagos con filtros
   */
  async findAll(filters: {
    companyId: string;
    parkingLotId?: string;
    from?: Date;
    to?: Date;
    status?: PaymentStatus;
  }) {
    const query = this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.items', 'items')
      .leftJoinAndSelect('payment.customer', 'customer')
      .leftJoinAndSelect('payment.parkingSession', 'session')
      .leftJoinAndSelect('session.vehicle', 'vehicle')
      .leftJoinAndSelect('payment.createdBy', 'createdBy')
      .where('payment.companyId = :companyId', { companyId: filters.companyId });

    if (filters.parkingLotId) {
      query.andWhere('payment.parkingLotId = :parkingLotId', {
        parkingLotId: filters.parkingLotId,
      });
    }

    if (filters.from && filters.to) {
      query.andWhere('payment.createdAt BETWEEN :from AND :to', {
        from: filters.from,
        to: filters.to,
      });
    }

    if (filters.status) {
      query.andWhere('payment.status = :status', { status: filters.status });
    }

    query.orderBy('payment.createdAt', 'DESC');

    return await query.getMany();
  }

  /**
   * Obtener pago por ID
   */
  async findOne(id: string, companyId: string) {
    const payment = await this.paymentRepo.findOne({
      where: { id, companyId },
      relations: [
        'items',
        'customer',
        'parkingSession',
        'parkingSession.vehicle',
        'createdBy',
        'voidedBy',
      ],
    });

    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    return payment;
  }

  /**
   * Anular pago (solo SUPERVISOR/ADMIN)
   */
  async voidPayment(id: string, companyId: string, userId: string, reason: string) {
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('La razón de anulación es obligatoria');
    }

    return await this.dataSource.transaction(async (manager) => {
      const payment = await manager.findOne(Payment, {
        where: { id, companyId },
      });

      if (!payment) {
        throw new NotFoundException('Pago no encontrado');
      }

      if (payment.status === PaymentStatus.VOIDED) {
        throw new BadRequestException('El pago ya está anulado');
      }

      const before = { ...payment };

      payment.status = PaymentStatus.VOIDED;
      payment.voidedByUserId = userId;
      payment.voidReason = reason;

      await manager.save(payment);

      // (E5/Sprint E) Devolución en caja: si el pago estaba asociado a un turno que
      // AÚN sigue abierto, registrar un egreso por la porción cobrada en EFECTIVO
      // (lo que sale físicamente del cajón). Tarjeta/transferencia/QR no afectan el
      // efectivo. La sesión de parqueo NO se reabre.
      if (payment.cashShiftId) {
        const shift = await manager.findOne(CashShift, {
          where: { id: payment.cashShiftId },
        });

        if (shift && shift.status === CashShiftStatus.OPEN) {
          const cashItems = await manager.find(PaymentItem, {
            where: { paymentId: payment.id, method: PaymentMethod.CASH },
          });
          const cashAmount = cashItems.reduce((sum, it) => sum + it.amount, 0);

          if (cashAmount > 0) {
            const movement = manager.create(CashMovement, {
              companyId,
              parkingLotId: payment.parkingLotId,
              cashShiftId: shift.id,
              type: CashMovementType.EXPENSE,
              category: CashMovementCategory.OTHER,
              amount: cashAmount,
              description: `Devolución por anulación de pago ${payment.id}: ${reason}`,
              createdByUserId: userId,
            });
            await manager.save(movement);
          }
        }
      }

      // AuditLog
      await manager.save(AuditLog, {
        companyId,
        userId,
        action: AuditAction.PAYMENT_VOIDED,
        entityType: 'Payment',
        entityId: payment.id,
        before,
        after: payment,
      });

      return payment;
    });
  }

  /**
   * Estadísticas de pagos por método
   */
  async getPaymentStats(companyId: string, parkingLotId?: string, from?: Date, to?: Date) {
    const query = this.paymentItemRepo
      .createQueryBuilder('item')
      .leftJoin('item.payment', 'payment')
      .select('item.method', 'method')
      .addSelect('COUNT(item.id)', 'count')
      .addSelect('SUM(item.amount)', 'total')
      .where('payment.companyId = :companyId', { companyId })
      .andWhere('payment.status = :status', { status: PaymentStatus.PAID });

    if (parkingLotId) {
      query.andWhere('payment.parkingLotId = :parkingLotId', { parkingLotId });
    }

    if (from && to) {
      query.andWhere('payment.createdAt BETWEEN :from AND :to', { from, to });
    }

    query.groupBy('item.method');

    const results = await query.getRawMany();

    return results.map((r) => ({
      method: r.method,
      count: parseInt(r.count, 10),
      total: parseInt(r.total, 10),
    }));
  }
}
