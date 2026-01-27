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
import { Customer } from './customer.entity';
import { Vehicle } from './vehicle-v2.entity';
import { ParkingSpot } from './parking-spot.entity';
import { User } from '../modules/users/entities/user.entity';

export enum ParkingSessionStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  CANCELED = 'CANCELED',
}

@Entity('parking_sessions')
export class ParkingSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'company_id' })
  companyId: string;

  @Column('uuid', { name: 'parking_lot_id' })
  parkingLotId: string;

  @Column('uuid', { name: 'customer_id', nullable: true })
  customerId: string | null;

  @Column('uuid', { name: 'vehicle_id' })
  vehicleId: string;

  @Column('uuid', { name: 'spot_id', nullable: true })
  spotId: string | null;

  @Column('timestamp', { name: 'entry_at', default: () => 'NOW()' })
  entryAt: Date;

  @Column('timestamp', { name: 'exit_at', nullable: true })
  exitAt: Date | null;

  @Column({
    type: 'enum',
    enum: ParkingSessionStatus,
    default: ParkingSessionStatus.ACTIVE,
    enumName: 'parking_session_status_enum',
  })
  status: ParkingSessionStatus;

  @Column('uuid', { name: 'created_by_user_id' })
  createdByUserId: string;

  @Column('uuid', { name: 'closed_by_user_id', nullable: true })
  closedByUserId: string | null;

  @Column('uuid', { name: 'canceled_by_user_id', nullable: true })
  canceledByUserId: string | null;

  @Column('text', { name: 'cancel_reason', nullable: true })
  cancelReason: string | null;

  @Column('varchar', { length: 50, name: 'ticket_number' })
  ticketNumber: string;

  @Column('timestamp', { name: 'ticket_printed_at', nullable: true })
  ticketPrintedAt: Date | null;

  @Column('int', { name: 'ticket_reprinted_count', default: 0 })
  ticketReprintedCount: number;

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

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Vehicle)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @ManyToOne(() => ParkingSpot, { nullable: true })
  @JoinColumn({ name: 'spot_id' })
  spot: ParkingSpot;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'closed_by_user_id' })
  closedByUser: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'canceled_by_user_id' })
  canceledByUser: User;
}
