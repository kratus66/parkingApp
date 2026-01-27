import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('invoice_counters')
export class InvoiceCounter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'parking_lot_id', unique: true })
  parkingLotId: string;

  @Column({ type: 'int', default: 0, comment: 'Último número de factura generado' })
  counter: number;

  @Column({ type: 'varchar', length: 10, default: 'INV', comment: 'Prefijo para facturas' })
  prefix: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
