import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CashMovement } from '../../../entities/cash-movement.entity';
import { CashShift, CashShiftStatus } from '../../../entities/cash-shift.entity';
import { AuditLog } from '../../audit/entities/audit-log.entity';
import { AuditAction } from '../../audit/enums/audit-action.enum';
import { CreateMovementDto } from '../dto/movement.dto';

@Injectable()
export class MovementsService {
  constructor(
    @InjectRepository(CashMovement)
    private movementsRepo: Repository<CashMovement>,
    @InjectRepository(CashShift)
    private shiftsRepo: Repository<CashShift>,
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
  ) {}

  async create(
    dto: CreateMovementDto,
    userId: string,
    companyId: string,
  ): Promise<CashMovement> {
    // Verify shift exists and is open
    const shift = await this.shiftsRepo.findOne({
      where: { id: dto.cashShiftId, companyId },
    });

    if (!shift) {
      throw new NotFoundException('Turno no encontrado');
    }

    if (shift.status !== CashShiftStatus.OPEN) {
      throw new ConflictException('El turno debe estar abierto para registrar movimientos');
    }

    if (shift.cashierUserId !== userId) {
      throw new ForbiddenException(
        'Solo puedes registrar movimientos en tu propio turno',
      );
    }

    const movement = this.movementsRepo.create({
      ...dto,
      companyId,
      parkingLotId: shift.parkingLotId,
      createdByUserId: userId,
    });

    const saved = await this.movementsRepo.save(movement);

    // Audit
    await this.auditRepo.save(
      this.auditRepo.create({
        companyId,
        parkingLotId: shift.parkingLotId,
        actorUserId: userId,
        action: AuditAction.CASH_MOVEMENT_CREATED,
        entityName: 'CashMovement',
        entityId: saved.id,
        after: saved,
      }),
    );

    return saved;
  }

  async findByShift(cashShiftId: string, companyId: string): Promise<CashMovement[]> {
    return await this.movementsRepo.find({
      where: { cashShiftId, companyId },
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async delete(
    id: string,
    userId: string,
    companyId: string,
    reason: string,
  ): Promise<void> {
    const movement = await this.movementsRepo.findOne({
      where: { id, companyId },
      relations: ['cashShift'],
    });

    if (!movement) {
      throw new NotFoundException('Movimiento no encontrado');
    }

    if (movement.cashShift.status !== CashShiftStatus.OPEN) {
      throw new ConflictException('No se pueden eliminar movimientos de un turno cerrado');
    }

    // Audit before delete
    await this.auditRepo.save(
      this.auditRepo.create({
        companyId,
        parkingLotId: movement.parkingLotId,
        actorUserId: userId,
        action: AuditAction.CASH_MOVEMENT_DELETED,
        entityName: 'CashMovement',
        entityId: id,
        before: movement,
      }),
    );

    await this.movementsRepo.remove(movement);
  }
}
