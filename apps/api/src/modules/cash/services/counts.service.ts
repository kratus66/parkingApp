import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CashCount, CashCountMethod } from '../../../entities/cash-count.entity';
import { CashShift, CashShiftStatus } from '../../../entities/cash-shift.entity';
import { AuditLog } from '../../audit/entities/audit-log.entity';
import { AuditAction } from '../../audit/enums/audit-action.enum';
import { CreateCountDto } from '../dto/count.dto';

@Injectable()
export class CountsService {
  constructor(
    @InjectRepository(CashCount)
    private countsRepo: Repository<CashCount>,
    @InjectRepository(CashShift)
    private shiftsRepo: Repository<CashShift>,
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
  ) {}

  async upsert(
    dto: CreateCountDto,
    userId: string,
    companyId: string,
  ): Promise<CashCount> {
    // Verify shift
    const shift = await this.shiftsRepo.findOne({
      where: { id: dto.cashShiftId, companyId },
    });

    if (!shift) {
      throw new NotFoundException('Turno no encontrado');
    }

    if (shift.status === CashShiftStatus.CLOSED) {
      throw new ConflictException('No se puede actualizar el arqueo de un turno cerrado');
    }

    // Validate cash count details
    if (dto.method === CashCountMethod.CASH && dto.details?.denominations) {
      const calculatedTotal = dto.details.denominations.reduce(
        (sum, d) => sum + d.value * d.qty,
        0,
      );

      if (dto.details.coinsTotal) {
        // Add coins
        const totalWithCoins = calculatedTotal + dto.details.coinsTotal;
        if (totalWithCoins !== dto.countedAmount) {
          throw new BadRequestException(
            `El total calculado (${totalWithCoins}) no coincide con countedAmount (${dto.countedAmount})`,
          );
        }
      } else if (calculatedTotal !== dto.countedAmount) {
        throw new BadRequestException(
          `El total calculado (${calculatedTotal}) no coincide con countedAmount (${dto.countedAmount})`,
        );
      }
    }

    // Check if exists
    const existing = await this.countsRepo.findOne({
      where: {
        cashShiftId: dto.cashShiftId,
        method: dto.method,
      },
    });

    let count: CashCount;
    let action: AuditAction;

    if (existing) {
      // Update
      existing.countedAmount = dto.countedAmount;
      existing.details = dto.details || null;
      count = await this.countsRepo.save(existing);
      action = AuditAction.CASH_COUNT_UPDATED;
    } else {
      // Create
      count = this.countsRepo.create({
        ...dto,
        companyId,
        parkingLotId: shift.parkingLotId,
        createdByUserId: userId,
      });
      count = await this.countsRepo.save(count);
      action = AuditAction.CASH_COUNT_CREATED;
    }

    // Audit
    await this.auditRepo.save(
      this.auditRepo.create({
        companyId,
        parkingLotId: shift.parkingLotId,
        actorUserId: userId,
        action,
        entityName: 'CashCount',
        entityId: count.id,
        after: count,
      }),
    );

    return count;
  }

  async findByShift(cashShiftId: string, companyId: string): Promise<CashCount[]> {
    return await this.countsRepo.find({
      where: { cashShiftId, companyId },
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });
  }
}
