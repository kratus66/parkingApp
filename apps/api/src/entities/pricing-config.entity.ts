import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '../modules/companies/entities/company.entity';
import { ParkingLot } from '../modules/parking-lots/entities/parking-lot.entity';

@Entity('pricing_config')
export class PricingConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'company_id' })
  companyId: string;

  @Column('uuid', { name: 'parking_lot_id', unique: true })
  parkingLotId: string;

  @Column('int', { name: 'default_grace_minutes', default: 0 })
  defaultGraceMinutes: number;

  @Column('int', { name: 'default_daily_max', nullable: true })
  defaultDailyMax: number | null;

  @Column('int', { name: 'lost_ticket_fee', nullable: true })
  lostTicketFee: number | null;

  @Column('boolean', { name: 'enable_dynamic_pricing', default: false })
  enableDynamicPricing: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => ParkingLot)
  @JoinColumn({ name: 'parking_lot_id' })
  parkingLot: ParkingLot;
}
