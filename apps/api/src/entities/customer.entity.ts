import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
  Unique,
} from 'typeorm';
import { Company } from '../modules/companies/entities/company.entity';
import { Vehicle } from './vehicle-v2.entity';
import { Consent } from './consent.entity';

export enum DocumentType {
  CC = 'CC',
  CE = 'CE',
  PASSPORT = 'PASSPORT',
  PPT = 'PPT',
  OTHER = 'OTHER',
}

@Entity('customers')
@Unique(['companyId', 'documentType', 'documentNumber'])
@Index(['documentNumber'])
@Index(['fullName'])
@Index(['phone'])
@Index(['email'])
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({
    type: 'enum',
    enum: DocumentType,
    name: 'document_type',
  })
  documentType: DocumentType;

  @Column({ type: 'varchar', length: 50, name: 'document_number' })
  documentNumber: string;

  @Column({ type: 'varchar', length: 255, name: 'full_name' })
  fullName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @OneToMany(() => Vehicle, (vehicle) => vehicle.customer)
  vehicles: Vehicle[];

  @OneToMany(() => Consent, (consent) => consent.customer)
  consents: Consent[];

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
