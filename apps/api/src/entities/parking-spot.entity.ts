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
import { ParkingLot } from '../modules/parking-lots/entities/parking-lot.entity';
import { ParkingZone, VehicleType } from './parking-zone.entity';

export enum SpotStatus {
  FREE = 'FREE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}

@Entity('parking_spots')
@Unique(['parkingLotId', 'code'])
@Index(['parkingLotId'])
@Index(['companyId'])
@Index(['zoneId'])
@Index(['status'])
@Index(['spotType'])
@Index(['code'])
export class ParkingSpot {
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

  @Column({ name: 'zone_id', type: 'uuid' })
  @Index()
  zoneId: string;

  @ManyToOne(() => ParkingZone, (zone) => zone.spots)
  @JoinColumn({ name: 'zone_id' })
  zone: ParkingZone;

  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({
    name: 'spot_type',
    type: 'enum',
    enum: VehicleType,
    enumName: 'vehicle_type_enum',
  })
  spotType: VehicleType;

  @Column({
    type: 'enum',
    enum: SpotStatus,
    enumName: 'spot_status_enum',
    default: SpotStatus.FREE,
  })
  status: SpotStatus;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'uuid', nullable: true, name: 'session_id' })
  sessionId?: string;

  @Column({ name: 'last_status_change', nullable: true })
  lastStatusChange?: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
