import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Company } from '../modules/companies/entities/company.entity';
import { ParkingLot } from '../modules/parking-lots/entities/parking-lot.entity';
import { User } from '../modules/users/entities/user.entity';
import { CashMovement } from './cash-movement.entity';
import { CashCount } from './cash-count.entity';
import { Payment } from './payment.entity';

export enum CashShiftStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  CANCELED = 'CANCELED',
}

@Entity('cash_shifts')
@Index(['parkingLotId', 'status'])
@Index(['cashierUserId', 'openedAt'])
export class CashShift {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  companyId: string;

  @Column({ type: 'uuid' })
  parkingLotId: string;

  @Column({ type: 'uuid' })
  cashierUserId: string;

  @Column({ type: 'timestamp' })
  openedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date | null;

  @Column({
    type: 'enum',
    enum: CashShiftStatus,
    default: CashShiftStatus.OPEN,
  })
  status: CashShiftStatus;

  @Column({ type: 'int', default: 0, comment: 'Base inicial en COP' })
  openingFloat: number;

  @Column({ type: 'text', nullable: true })
  openingNotes: string | null;

  @Column({ type: 'text', nullable: true })
  closingNotes: string | null;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Total esperado calculado al cierre',
  })
  expectedTotal: number;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'Total contado en arqueo',
  })
  countedTotal: number | null;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'Diferencia: countedTotal - expectedTotal',
  })
  difference: number | null;

  @Column({ type: 'boolean', default: false })
  requireSupervisorApproval: boolean;

  @Column({ type: 'uuid', nullable: true })
  approvedByUserId: string | null;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @ManyToOne(() => ParkingLot)
  @JoinColumn({ name: 'parkingLotId' })
  parkingLot: ParkingLot;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'cashierUserId' })
  cashier: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approvedByUserId' })
  approvedBy: User | null;

  @OneToMany(() => CashMovement, (movement) => movement.cashShift)
  movements: CashMovement[];

  @OneToMany(() => CashCount, (count) => count.cashShift)
  counts: CashCount[];

  @OneToMany(() => Payment, (payment) => payment.cashShift)
  payments: Payment[];
}
