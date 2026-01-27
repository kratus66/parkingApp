import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CustomerInvoice } from './customer-invoice.entity';

@Entity('customer_invoice_items')
export class CustomerInvoiceItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'customer_invoice_id' })
  customerInvoiceId: string;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'int', name: 'unit_price', comment: 'Precio unitario en COP (centavos)' })
  unitPrice: number;

  @Column({ type: 'int', comment: 'Total en COP (centavos)' })
  total: number;

  // Relaciones
  @ManyToOne(() => CustomerInvoice, (invoice) => invoice.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_invoice_id' })
  customerInvoice: CustomerInvoice;
}
