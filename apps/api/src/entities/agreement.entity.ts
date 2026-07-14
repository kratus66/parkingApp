import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Company } from '../modules/companies/entities/company.entity';

export enum AgreementDiscountType {
  /** Descuento porcentual sobre el subtotal (0-100). */
  PERCENT = 'PERCENT',
  /** Descuento de monto fijo en COP. */
  FIXED = 'FIXED',
}

/**
 * Convenio: acuerdo con una empresa/entidad que otorga un descuento a los
 * clientes asociados (p. ej. empleados de una empresa vecina, centro comercial).
 */
@Entity('agreements')
@Unique(['companyId', 'name'])
@Index(['companyId'])
@Index(['isActive'])
export class Agreement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  /** Parqueadero específico; null = aplica a todos los parqueaderos de la empresa. */
  @Column({ type: 'uuid', name: 'parking_lot_id', nullable: true })
  parkingLotId: string | null;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nit: string | null;

  @Column({
    type: 'enum',
    enum: AgreementDiscountType,
    name: 'discount_type',
    default: AgreementDiscountType.PERCENT,
  })
  discountType: AgreementDiscountType;

  /** Valor del descuento: porcentaje (0-100) si PERCENT, o COP si FIXED. */
  @Column({ type: 'int', name: 'discount_value', default: 0 })
  discountValue: number;

  @Column({ type: 'date', name: 'valid_from', nullable: true })
  validFrom: string | null;

  @Column({ type: 'date', name: 'valid_until', nullable: true })
  validUntil: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
