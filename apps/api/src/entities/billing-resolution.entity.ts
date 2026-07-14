import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Resolución de numeración DIAN por parqueadero. Autoriza un prefijo y un rango
 * consecutivo [rangeFrom, rangeTo] durante una vigencia. El consecutivo actual
 * avanza dentro del rango. `technicalKey` (clave técnica) se usa en el CUFE.
 */
@Entity('billing_resolutions')
@Index(['parkingLotId'], { unique: true })
export class BillingResolution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @Column({ type: 'uuid', name: 'parking_lot_id' })
  parkingLotId: string;

  @Column({ type: 'varchar', length: 40, name: 'document_type', default: 'FACTURA_VENTA' })
  documentType: string;

  @Column({ type: 'varchar', length: 10, default: '' })
  prefix: string;

  @Column({ type: 'varchar', length: 50, name: 'resolution_number' })
  resolutionNumber: string;

  @Column({ type: 'int', name: 'range_from', default: 1 })
  rangeFrom: number;

  @Column({ type: 'int', name: 'range_to', default: 1 })
  rangeTo: number;

  @Column({ type: 'int', name: 'current_number', default: 0, comment: 'Último consecutivo usado' })
  currentNumber: number;

  @Column({ type: 'date', name: 'valid_from', nullable: true })
  validFrom: string | null;

  @Column({ type: 'date', name: 'valid_until', nullable: true })
  validUntil: string | null;

  @Column({ type: 'varchar', length: 100, name: 'technical_key', nullable: true, comment: 'Clave técnica DIAN (CUFE)' })
  technicalKey: string | null;

  /** Ambiente DIAN: 1 producción, 2 pruebas. */
  @Column({ type: 'int', name: 'environment', default: 2 })
  environment: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
