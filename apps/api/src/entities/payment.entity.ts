import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ParkingSession } from './parking-session.entity';
import { Customer } from './customer.entity';
import { User } from '../modules/users/entities/user.entity';
import { PaymentItem } from './payment-item.entity';
import { CashShift } from './cash-shift.entity';

export enum PaymentStatus {
  PAID = 'PAID',
  VOIDED = 'VOIDED',
  REFUNDED = 'REFUNDED',
  PARTIAL = 'PARTIAL',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @Column({ type: 'uuid', name: 'parking_lot_id' })
  parkingLotId: string;

  @Column({ type: 'uuid', name: 'parking_session_id' })
  parkingSessionId: string;

  @Column({ type: 'uuid', name: 'customer_id', nullable: true })
  customerId: string;

  @Column({ type: 'int', name: 'total_amount', comment: 'Total en COP (centavos)' })
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PAID,
  })
  status: PaymentStatus;

  @Column({ type: 'uuid', name: 'created_by_user_id' })
  createdByUserId: string;

  @Column({ type: 'uuid', name: 'voided_by_user_id', nullable: true })
  voidedByUserId: string;

  @Column({ type: 'text', name: 'void_reason', nullable: true })
  voidReason: string;

  @Column({ type: 'uuid', name: 'cash_shift_id', nullable: true })
  cashShiftId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => ParkingSession)
  @JoinColumn({ name: 'parking_session_id' })
  parkingSession: ParkingSession;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'voided_by_user_id' })
  voidedBy: User;

  @ManyToOne(() => CashShift, (shift) => shift.payments, { nullable: true })
  @JoinColumn({ name: 'cash_shift_id' })
  cashShift: CashShift | null;

  @OneToMany(() => PaymentItem, (item) => item.payment, { cascade: true })
  items: PaymentItem[];
}
