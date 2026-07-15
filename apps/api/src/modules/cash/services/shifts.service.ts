import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { CashShift, CashShiftStatus } from '../../../entities/cash-shift.entity';
import { CashPolicy } from '../../../entities/cash-policy.entity';
import { CashMovement, CashMovementType } from '../../../entities/cash-movement.entity';
import { CashCount } from '../../../entities/cash-count.entity';
import { Payment, PaymentStatus } from '../../../entities/payment.entity';
import { PaymentItem, PaymentMethod } from '../../../entities/payment-item.entity';
import { AuditLog } from '../../audit/entities/audit-log.entity';
import { AuditAction } from '../../audit/enums/audit-action.enum';
import { OpenShiftDto, CloseShiftDto } from '../dto/shift.dto';

@Injectable()
export class ShiftsService {
  constructor(
    @InjectRepository(CashShift)
    private shiftsRepo: Repository<CashShift>,
    @InjectRepository(CashPolicy)
    private policyRepo: Repository<CashPolicy>,
    @InjectRepository(CashMovement)
    private movementsRepo: Repository<CashMovement>,
    @InjectRepository(CashCount)
    private countsRepo: Repository<CashCount>,
    @InjectRepository(Payment)
    private paymentsRepo: Repository<Payment>,
    @InjectRepository(PaymentItem)
    private paymentItemsRepo: Repository<PaymentItem>,
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
  ) {}

  async openShift(
    dto: OpenShiftDto,
    userId: string,
    companyId: string,
  ): Promise<CashShift> {
    // Get policy
    const policy = await this.policyRepo.findOne({
      where: { parkingLotId: dto.parkingLotId },
    });

    if (policy) {
      // Check if cashier already has open shift
      if (!policy.allowMultipleOpenShiftsPerCashier) {
        const existingShift = await this.shiftsRepo.findOne({
          where: {
            cashierUserId: userId,
            parkingLotId: dto.parkingLotId,
            status: CashShiftStatus.OPEN,
          },
        });

        if (existingShift) {
          throw new ConflictException(
            'Ya tienes un turno abierto. Cierra el turno actual antes de abrir uno nuevo.',
          );
        }
      }

      // Check multiple open shifts per parking lot
      if (!policy.allowMultipleOpenShiftsPerParkingLot) {
        const openShiftsCount = await this.shiftsRepo.count({
          where: {
            parkingLotId: dto.parkingLotId,
            status: CashShiftStatus.OPEN,
          },
        });

        if (openShiftsCount > 0) {
          throw new ConflictException(
            'Ya existe un turno abierto en este parqueadero. Solo se permite un turno activo a la vez.',
          );
        }
      }
    }

    // Create shift
    const shift = this.shiftsRepo.create({
      companyId,
      parkingLotId: dto.parkingLotId,
      cashierUserId: userId,
      openedAt: new Date(),
      status: CashShiftStatus.OPEN,
      openingFloat: dto.openingFloat,
      openingNotes: dto.openingNotes,
    });

    const saved = await this.shiftsRepo.save(shift);

    // Audit
    await this.auditRepo.save(
      this.auditRepo.create({
        companyId,
        parkingLotId: dto.parkingLotId,
        actorUserId: userId,
        action: AuditAction.CASH_SHIFT_OPENED,
        entityName: 'CashShift',
        entityId: saved.id,
        after: saved,
      }),
    );

    return saved;
  }

  async getCurrentShift(
    parkingLotId: string,
    userId: string,
    companyId: string,
  ): Promise<CashShift | null> {
    try {
      return await this.shiftsRepo.findOne({
        where: {
          companyId,
          parkingLotId,
          cashierUserId: userId,
          status: CashShiftStatus.OPEN,
        },
        relations: ['cashier', 'parkingLot'],
      });
    } catch (error) {
      console.error('Error loading current shift:', error);
      // Si falla con relaciones, intentar sin ellas
      return await this.shiftsRepo.findOne({
        where: {
          companyId,
          parkingLotId,
          cashierUserId: userId,
          status: CashShiftStatus.OPEN,
        },
      });
    }
  }

  async closeShift(
    shiftId: string,
    dto: CloseShiftDto,
    userId: string,
    companyId: string,
  ): Promise<CashShift> {
    const shift = await this.shiftsRepo.findOne({
      where: { id: shiftId, companyId },
      relations: ['counts', 'movements'],
    });

    if (!shift) {
      throw new NotFoundException('Turno no encontrado');
    }

    if (shift.status !== CashShiftStatus.OPEN) {
      throw new ConflictException('El turno ya está cerrado');
    }

    if (shift.cashierUserId !== userId) {
      throw new ForbiddenException('Solo el cajero puede cerrar su propio turno');
    }

    // (H5/Sprint D) Esperado POR MÉTODO: el efectivo esperado en el cajón NO incluye
    // pagos con tarjeta/transferencia/QR. Cada método se concilia contra su propio arqueo.
    const expectedByMethod = await this.computeExpectedByMethod(shiftId);
    const expectedTotal = Object.values(expectedByMethod).reduce((s, v) => s + v, 0);

    // Arqueos registrados (una fila por método contado)
    const counts = await this.countsRepo.find({
      where: { cashShiftId: shiftId },
    });

    const countedTotal = counts.reduce((sum, count) => sum + count.countedAmount, 0);

    // La diferencia se calcula SOLO sobre los métodos efectivamente arqueados,
    // comparando cada método contra su esperado (evita falsos faltantes cuando el
    // cajero solo cuenta el efectivo del cajón).
    const difference =
      counts.length > 0
        ? counts.reduce(
            (sum, c) => sum + (c.countedAmount - (expectedByMethod[c.method] ?? 0)),
            0,
          )
        : null;

    // Update shift
    shift.status = CashShiftStatus.CLOSED;
    shift.closedAt = new Date();
    shift.closingNotes = dto.closingNotes || null;
    shift.expectedTotal = expectedTotal;
    shift.countedTotal = counts.length > 0 ? countedTotal : null;
    shift.difference = difference;

    const updated = await this.shiftsRepo.save(shift);

    // Audit
    await this.auditRepo.save(
      this.auditRepo.create({
        companyId,
        parkingLotId: shift.parkingLotId,
        actorUserId: userId,
        action: AuditAction.CASH_SHIFT_CLOSED,
        entityName: 'CashShift',
        entityId: shiftId,
        after: updated,
      }),
    );

    return updated;
  }

  /**
   * (H5/Sprint D) Calcula el monto esperado POR MÉTODO de pago al cierre del turno.
   *
   * - CASH: base inicial + Σ items en efectivo (monto cobrado, el cambio ya está
   *   descontado porque `amount` es lo cobrado) + ingresos − egresos de caja.
   * - CARD/TRANSFER/QR/OTHER: Σ de los items de ese método (no tocan el cajón físico).
   *
   * Solo cuenta pagos PAID del turno (los anulados quedan fuera).
   */
  private async computeExpectedByMethod(
    shiftId: string,
  ): Promise<Record<string, number>> {
    const shift = await this.shiftsRepo.findOne({ where: { id: shiftId } });

    const expected: Record<string, number> = {
      [PaymentMethod.CASH]: 0,
      [PaymentMethod.CARD]: 0,
      [PaymentMethod.TRANSFER]: 0,
      [PaymentMethod.QR]: 0,
      [PaymentMethod.OTHER]: 0,
    };

    if (!shift) return expected;

    // Base inicial de efectivo
    expected[PaymentMethod.CASH] += shift.openingFloat;

    // Items de pago (PAID) del turno, agrupados por método
    const items = await this.paymentItemsRepo
      .createQueryBuilder('item')
      .select('item.method', 'method')
      .addSelect('SUM(item.amount)', 'total')
      .innerJoin('item.payment', 'payment')
      .where('payment.cashShiftId = :shiftId', { shiftId })
      .andWhere('payment.status = :status', { status: PaymentStatus.PAID })
      .groupBy('item.method')
      .getRawMany();

    for (const row of items) {
      const method = row.method as PaymentMethod;
      if (method in expected) {
        expected[method] += parseInt(row.total, 10) || 0;
      }
    }

    // Ingresos/egresos de caja afectan solo el efectivo del cajón
    const incomes = await this.movementsRepo.find({
      where: { cashShiftId: shiftId, type: CashMovementType.INCOME },
    });
    expected[PaymentMethod.CASH] += incomes.reduce((sum, m) => sum + m.amount, 0);

    const expenses = await this.movementsRepo.find({
      where: { cashShiftId: shiftId, type: CashMovementType.EXPENSE },
    });
    expected[PaymentMethod.CASH] -= expenses.reduce((sum, m) => sum + m.amount, 0);

    return expected;
  }

  async getShiftSummary(shiftId: string, companyId: string): Promise<any> {
    const shift = await this.shiftsRepo.findOne({
      where: { id: shiftId, companyId },
      relations: ['cashier', 'parkingLot', 'counts', 'movements'],
    });

    if (!shift) {
      throw new NotFoundException('Turno no encontrado');
    }

    // Get payments
    const payments = await this.paymentsRepo.find({
      where: {
        cashShiftId: shiftId,
        status: PaymentStatus.PAID,
      },
      relations: ['items'],
    });

    const totalPayments = payments.reduce((sum, p) => sum + p.totalAmount, 0);

    // Get movements
    const movements = await this.movementsRepo.find({
      where: { cashShiftId: shiftId },
      order: { createdAt: 'DESC' },
    });

    const incomes = movements.filter((m) => m.type === CashMovementType.INCOME);
    const expenses = movements.filter((m) => m.type === CashMovementType.EXPENSE);
    const totalIncome = incomes.reduce((sum, m) => sum + m.amount, 0);
    const totalExpenses = expenses.reduce((sum, m) => sum + m.amount, 0);

    // Get counts
    const counts = await this.countsRepo.find({
      where: { cashShiftId: shiftId },
      order: { method: 'ASC' },
    });

    const countedTotal = counts.reduce((sum, c) => sum + c.countedAmount, 0);

    // (H5/Sprint D) Esperado por método y conciliación por método.
    const expectedByMethod = await this.computeExpectedByMethod(shiftId);
    const expectedTotal = Object.values(expectedByMethod).reduce((s, v) => s + v, 0);

    // Conciliación por método: esperado vs contado (solo métodos arqueados aportan
    // a la diferencia, para no marcar faltantes por métodos sin arqueo físico).
    const countedByMethod = new Map<string, number>();
    counts.forEach((c) => countedByMethod.set(c.method, c.countedAmount));

    const byMethod = Object.entries(expectedByMethod).map(([method, exp]) => {
      const counted = countedByMethod.has(method)
        ? (countedByMethod.get(method) as number)
        : null;
      return {
        method,
        expected: exp,
        counted,
        difference: counted !== null ? counted - exp : null,
      };
    });

    const difference =
      counts.length > 0
        ? counts.reduce(
            (sum, c) => sum + (c.countedAmount - (expectedByMethod[c.method] ?? 0)),
            0,
          )
        : null;

    return {
      shift: {
        id: shift.id,
        openedAt: shift.openedAt,
        closedAt: shift.closedAt,
        status: shift.status,
        openingFloat: shift.openingFloat,
        openingNotes: shift.openingNotes,
        closingNotes: shift.closingNotes,
        expectedTotal: shift.expectedTotal ?? expectedTotal,
        countedTotal: shift.countedTotal,
        difference: shift.difference,
        cashier: shift.cashier ? {
          id: shift.cashier.id,
          name: shift.cashier.fullName,
          email: shift.cashier.email,
        } : null,
        parkingLot: shift.parkingLot ? {
          id: shift.parkingLot.id,
          name: shift.parkingLot.name,
        } : null,
      },
      totals: {
        totalPayments,
        paymentsCount: payments.length,
        totalIncome,
        totalExpenses,
        expectedTotal: shift.expectedTotal ?? expectedTotal,
        countedTotal: shift.countedTotal !== null ? shift.countedTotal : countedTotal,
        difference: shift.difference !== null ? shift.difference : difference,
      },
      byMethod,
      payments,
      movements,
      counts,
    };
  }

  async findAll(
    companyId: string,
    parkingLotId?: string,
    status?: CashShiftStatus,
    cashierUserId?: string,
    from?: Date,
    to?: Date,
  ): Promise<CashShift[]> {
    const where: any = { companyId };

    if (parkingLotId) where.parkingLotId = parkingLotId;
    if (status) where.status = status;
    if (cashierUserId) where.cashierUserId = cashierUserId;

    const qb = this.shiftsRepo.createQueryBuilder('shift').where(where);

    if (from) {
      qb.andWhere('shift.openedAt >= :from', { from });
    }

    if (to) {
      qb.andWhere('shift.openedAt <= :to', { to });
    }

    return await qb
      .leftJoinAndSelect('shift.cashier', 'cashier')
      .leftJoinAndSelect('shift.parkingLot', 'parkingLot')
      .orderBy('shift.openedAt', 'DESC')
      .getMany();
  }
}
