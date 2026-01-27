import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Company } from '../../companies/entities/company.entity';
import { ParkingLot } from '../../parking-lots/entities/parking-lot.entity';
import { UserRole } from '../enums/user-role.enum';
import { AuditLog } from '../../audit/entities/audit-log.entity';

// Re-export for convenience
export { UserRole };

@Entity('users')
@Index(['email'], { unique: true })
@Index(['companyId'])
@Index(['parkingLotId'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @Column({ type: 'uuid', name: 'parking_lot_id', nullable: true })
  parkingLotId: string;

  @Column({ type: 'varchar', length: 255, name: 'full_name' })
  fullName: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  @Exclude()
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CASHIER,
  })
  role: UserRole;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Company, (company) => company.users)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => ParkingLot, (parkingLot) => parkingLot.users, { nullable: true })
  @JoinColumn({ name: 'parking_lot_id' })
  parkingLot: ParkingLot;

  @OneToMany(() => AuditLog, (auditLog) => auditLog.actorUser)
  actorLogs: AuditLog[];
}
