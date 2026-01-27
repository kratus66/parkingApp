import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { User } from '../../users/entities/user.entity';
import { AuditLog } from '../../audit/entities/audit-log.entity';
import { Ticket } from '../../../entities/ticket.entity';

@Entity('parking_lots')
@Index(['companyId'])
export class ParkingLot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'legal_name' })
  legalName: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'legal_nit' })
  legalNit: string;

  @Column({ type: 'jsonb', nullable: true, name: 'ticket_header' })
  ticketHeader: {
    companyName?: string;
    nit?: string;
    address?: string;
    phone?: string;
    email?: string;
    footerText?: string;
  };

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Company, (company) => company.parkingLots)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @OneToMany(() => User, (user) => user.parkingLot)
  users: User[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.parkingLot)
  auditLogs: AuditLog[];

  @OneToMany(() => Ticket, (ticket) => ticket.parkingLot)
  tickets: Ticket[];
}
