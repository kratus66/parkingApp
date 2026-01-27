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

export enum CashMovementType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum CashMovementCategory {
  SUPPLIES = 'SUPPLIES',
  MAINTENANCE = 'MAINTENANCE',
  PETTY_CASH = 'PETTY_CASH',
  OTHER = 'OTHER',
}

@Entity('cash_movements')
@Index(['cashShiftId', 'createdAt'])
export class CashMovement {
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
    enum: CashMovementType,
  })
  type: CashMovementType;

  @Column({
    type: 'enum',
    enum: CashMovementCategory,
  })
  category: CashMovementCategory;

  @Column({ type: 'int', comment: 'Monto en COP' })
  amount: number;

  @Column({ type: 'varchar', length: 500 })
  description: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reference: string | null;

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

  @ManyToOne(() => CashShift, (shift) => shift.movements)
  @JoinColumn({ name: 'cashShiftId' })
  cashShift: CashShift;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdByUserId' })
  createdBy: User;
}
