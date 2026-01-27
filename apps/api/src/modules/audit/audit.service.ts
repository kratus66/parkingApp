import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditAction } from './enums/audit-action.enum';
import { QueryAuditDto } from './dto/query-audit.dto';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async createAuditLog(data: Partial<AuditLog>): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create(data);
    return this.auditLogRepository.save(auditLog);
  }

  async log(data: {
    action: string;
    entityType: string;
    entityId: string;
    userId: string;
    companyId: string;
    parkingLotId?: string;
    metadata?: any;
  }): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      action: data.action as AuditAction,
      entityName: data.entityType,
      entityId: data.entityId,
      actorUserId: data.userId,
      companyId: data.companyId,
      parkingLotId: data.parkingLotId,
      after: data.metadata, // Usamos el campo 'after' para guardar metadata
    });
    return this.auditLogRepository.save(auditLog);
  }

  // Alias para compatibilidad con Sprint 3
  async logAction(data: {
    action: string;
    entityType: string;
    entityId: string;
    userId: string;
    companyId: string;
    parkingLotId?: string;
    metadata?: any;
  }): Promise<AuditLog> {
    return this.log(data);
  }

  async findAll(queryDto: QueryAuditDto, userCompanyId: string) {
    const { entityName, action, from, to, limit = 100, offset = 0 } = queryDto;

    const where: any = {
      companyId: userCompanyId,
    };

    if (entityName) {
      where.entityName = entityName;
    }

    if (action) {
      where.action = action;
    }

    if (from && to) {
      where.createdAt = Between(new Date(from), new Date(to));
    } else if (from) {
      where.createdAt = Between(new Date(from), new Date());
    }

    const [results, total] = await this.auditLogRepository.findAndCount({
      where,
      relations: ['actorUser', 'parkingLot'],
      order: {
        createdAt: 'DESC',
      },
      take: limit,
      skip: offset,
    });

    return {
      results,
      total,
      limit,
      offset,
    };
  }
}
