import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Company } from '../modules/companies/entities/company.entity';
import { ParkingLot } from '../modules/parking-lots/entities/parking-lot.entity';
import { CashShift } from './cash-shift.entity';
import { User } from '../modules/users/entities/user.entity';

export enum CashCountMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  TRANSFER = 'TRANSFER',
  QR = 'QR',
  OTHER = 'OTHER',
}

export interface CashDenomination {
  value: number;
  qty: number;
}

export interface CashCountDetails {
  denominations?: CashDenomination[];
  coinsTotal?: number;
  notes?: string;
}

@Entity('cash_counts')
@Index(['cashShiftId', 'method'], { unique: true })
export class CashCount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  companyId: string;

  @Column({ type: 'uuid' })
  parkingLotId: string;

  @Column({ type: 'uuid' })
  cashShiftId: string;

  @Column({
    type: 'enum',
    enum: CashCountMethod,
  })
  method: CashCountMethod;

  @Column({ type: 'int', comment: 'Monto contado en COP' })
  countedAmount: number;

  @Column({ type: 'jsonb', nullable: true })
  details: CashCountDetails | null;

  @Column({ type: 'uuid' })
  createdByUserId: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @ManyToOne(() => ParkingLot)
  @JoinColumn({ name: 'parkingLotId' })
  parkingLot: ParkingLot;

  @ManyToOne(() => CashShift, (shift) => shift.counts)
  @JoinColumn({ name: 'cashShiftId' })
  cashShift: CashShift;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdByUserId' })
  createdBy: User;
}
