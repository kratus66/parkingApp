import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Company } from '../modules/companies/entities/company.entity';
import { ParkingLot } from '../modules/parking-lots/entities/parking-lot.entity';
import { User } from '../modules/users/entities/user.entity';

export enum TariffChangeType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  ACTIVATE = 'ACTIVATE',
  DEACTIVATE = 'DEACTIVATE',
}

@Entity('tariff_change_logs')
export class TariffChangeLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'company_id' })
  companyId: string;

  @Column('uuid', { name: 'parking_lot_id' })
  parkingLotId: string;

  @Column('uuid', { name: 'actor_user_id' })
  actorUserId: string;

  @Column('varchar', { length: 50 })
  entity: string; // 'TariffPlan' | 'TariffRule' | 'PricingConfig' | 'Holiday'

  @Column('uuid', { name: 'entity_id' })
  entityId: string;

  @Column({
    type: 'enum',
    enum: TariffChangeType,
    name: 'change_type',
  })
  changeType: TariffChangeType;

  @Column('jsonb', { nullable: true })
  before: any;

  @Column('jsonb', { nullable: true })
  after: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => ParkingLot)
  @JoinColumn({ name: 'parking_lot_id' })
  parkingLot: ParkingLot;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'actor_user_id' })
  actorUser: User;
}
