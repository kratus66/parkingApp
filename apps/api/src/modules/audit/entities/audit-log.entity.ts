import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { ParkingLot } from '../../parking-lots/entities/parking-lot.entity';
import { User } from '../../users/entities/user.entity';
import { AuditAction } from '../enums/audit-action.enum';

@Entity('audit_logs')
@Index(['companyId'])
@Index(['parkingLotId'])
@Index(['actorUserId'])
@Index(['entityName'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @Column({ type: 'uuid', name: 'parking_lot_id', nullable: true })
  parkingLotId: string;

  @Column({ type: 'uuid', name: 'actor_user_id', nullable: true })
  actorUserId: string;

  @Column({ type: 'varchar', length: 100, name: 'entity_name' })
  entityName: string;

  @Column({ type: 'uuid', name: 'entity_id' })
  entityId: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column({ type: 'jsonb', nullable: true })
  before: any;

  @Column({ type: 'jsonb', nullable: true })
  after: any;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ip: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'user_agent' })
  userAgent: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Company, (company) => company.auditLogs)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => ParkingLot, (parkingLot) => parkingLot.auditLogs, { nullable: true })
  @JoinColumn({ name: 'parking_lot_id' })
  parkingLot: ParkingLot;

  @ManyToOne(() => User, (user) => user.actorLogs, { nullable: true })
  @JoinColumn({ name: 'actor_user_id' })
  actorUser: User;
}
