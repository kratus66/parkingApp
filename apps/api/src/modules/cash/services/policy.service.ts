import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CashPolicy } from '../../../entities/cash-policy.entity';
import { UpdatePolicyDto } from '../dto/policy.dto';
import { AuditLog } from '../../audit/entities/audit-log.entity';
import { AuditAction } from '../../audit/enums/audit-action.enum';

@Injectable()
export class PolicyService {
  constructor(
    @InjectRepository(CashPolicy)
    private policyRepo: Repository<CashPolicy>,
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
  ) {}

  async getPolicy(
    parkingLotId: string,
    companyId: string,
  ): Promise<CashPolicy | null> {
    return await this.policyRepo.findOne({
      where: { parkingLotId, companyId },
    });
  }

  async upsertPolicy(
    parkingLotId: string,
    companyId: string,
    dto: UpdatePolicyDto,
    userId: string,
  ): Promise<CashPolicy> {
    let policy = await this.policyRepo.findOne({
      where: { parkingLotId, companyId },
    });

    const before = policy ? { ...policy } : null;

    if (policy) {
      // Update
      Object.assign(policy, dto);
    } else {
      // Create with defaults
      policy = this.policyRepo.create({
        companyId,
        parkingLotId,
        requireOpenShiftForCheckout: true,
        defaultShiftHours: 8,
        allowMultipleOpenShiftsPerCashier: false,
        allowMultipleOpenShiftsPerParkingLot: true,
        ...dto,
      });
    }

    const saved = await this.policyRepo.save(policy);

    // Audit
    await this.auditRepo.save(
      this.auditRepo.create({
        companyId,
        parkingLotId,
        actorUserId: userId,
        action: before ? AuditAction.CASH_POLICY_UPDATED : AuditAction.CASH_POLICY_CREATED,
        entityName: 'CashPolicy',
        entityId: saved.id,
        before,
        after: saved,
      }),
    );

    return saved;
  }
}
