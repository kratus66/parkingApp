import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Payment } from './payment.entity';

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  TRANSFER = 'TRANSFER',
  QR = 'QR',
  OTHER = 'OTHER',
}

@Entity('payment_items')
export class PaymentItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'payment_id' })
  paymentId: string;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  method: PaymentMethod;

  @Column({ type: 'int', comment: 'Monto en COP (centavos)' })
  amount: number;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: 'Referencia/voucher' })
  reference: string;

  @Column({
    type: 'int',
    name: 'received_amount',
    nullable: true,
    comment: 'Solo CASH: monto recibido',
  })
  receivedAmount: number;

  @Column({
    type: 'int',
    name: 'change_amount',
    nullable: true,
    comment: 'Solo CASH: cambio devuelto',
  })
  changeAmount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relaciones
  @ManyToOne(() => Payment, (payment) => payment.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;
}
