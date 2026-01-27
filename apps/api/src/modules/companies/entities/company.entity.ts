import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ParkingLot } from '../../parking-lots/entities/parking-lot.entity';
import { User } from '../../users/entities/user.entity';
import { AuditLog } from '../../audit/entities/audit-log.entity';
import { Vehicle } from '../../../entities/vehicle.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nit: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => ParkingLot, (parkingLot) => parkingLot.company)
  parkingLots: ParkingLot[];

  @OneToMany(() => User, (user) => user.company)
  users: User[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.company)
  auditLogs: AuditLog[];

  @OneToMany(() => Vehicle, (vehicle) => vehicle.company)
  vehicles: Vehicle[];
}
