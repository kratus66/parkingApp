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
import { CustomerInvoiceItem } from './customer-invoice-item.entity';

export enum InvoiceStatus {
  ISSUED = 'ISSUED',
  VOIDED = 'VOIDED',
}

@Entity('customer_invoices')
export class CustomerInvoice {
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

  @Column({ type: 'varchar', length: 50, name: 'invoice_number', unique: true })
  invoiceNumber: string;

  @Column({ type: 'timestamp', name: 'issued_at' })
  issuedAt: Date;

  @Column({ type: 'int', comment: 'Subtotal en COP (centavos)' })
  subtotal: number;

  @Column({ type: 'int', default: 0, comment: 'Descuentos en COP (centavos)' })
  discounts: number;

  @Column({ type: 'int', comment: 'Total en COP (centavos)' })
  total: number;

  @Column({ type: 'varchar', length: 3, default: 'COP' })
  currency: string;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.ISSUED,
  })
  status: InvoiceStatus;

  @Column({ type: 'uuid', name: 'voided_by_user_id', nullable: true })
  voidedByUserId: string;

  @Column({ type: 'text', name: 'void_reason', nullable: true })
  voidReason: string;

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
  @JoinColumn({ name: 'voided_by_user_id' })
  voidedBy: User;

  @OneToMany(() => CustomerInvoiceItem, (item) => item.customerInvoice, { cascade: true })
  items: CustomerInvoiceItem[];
}
