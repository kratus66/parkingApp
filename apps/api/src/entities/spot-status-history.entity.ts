import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Company } from '../modules/companies/entities/company.entity';
import { ParkingLot } from '../modules/parking-lots/entities/parking-lot.entity';
import { ParkingSpot, SpotStatus } from './parking-spot.entity';
import { User } from '../modules/users/entities/user.entity';

@Entity('spot_status_history')
@Index(['spotId'])
@Index(['parkingLotId'])
@Index(['companyId'])
@Index(['createdAt'])
export class SpotStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  @Index()
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'parking_lot_id', type: 'uuid' })
  @Index()
  parkingLotId: string;

  @ManyToOne(() => ParkingLot)
  @JoinColumn({ name: 'parking_lot_id' })
  parkingLot: ParkingLot;

  @Column({ name: 'spot_id', type: 'uuid' })
  @Index()
  spotId: string;

  @ManyToOne(() => ParkingSpot)
  @JoinColumn({ name: 'spot_id' })
  spot: ParkingSpot;

  @Column({
    name: 'from_status',
    type: 'enum',
    enum: SpotStatus,
    enumName: 'spot_status_enum',
  })
  fromStatus: SpotStatus;

  @Column({
    name: 'to_status',
    type: 'enum',
    enum: SpotStatus,
    enumName: 'spot_status_enum',
  })
  toStatus: SpotStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  reason: string;

  @Column({ name: 'actor_user_id', type: 'uuid' })
  actorUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'actor_user_id' })
  actorUser: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
