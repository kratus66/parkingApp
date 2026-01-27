import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { ParkingLot } from '../modules/parking-lots/entities/parking-lot.entity';
import { User } from '../modules/users/entities/user.entity';

export enum TicketStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  TRANSFER = 'TRANSFER',
  MOBILE = 'MOBILE',
}

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ticket_number', unique: true, length: 20 })
  ticketNumber: string;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.tickets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column({ name: 'vehicle_id', type: 'uuid' })
  vehicleId: string;

  @ManyToOne(() => ParkingLot, (parkingLot) => parkingLot.tickets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parking_lot_id' })
  parkingLot: ParkingLot;

  @Column({ name: 'parking_lot_id', type: 'uuid' })
  parkingLotId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'entry_user_id' })
  entryUser: User;

  @Column({ name: 'entry_user_id', type: 'uuid' })
  entryUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'exit_user_id' })
  exitUser: User;

  @Column({ name: 'exit_user_id', type: 'uuid', nullable: true })
  exitUserId: string;

  @Column({ name: 'entry_time', type: 'timestamp' })
  entryTime: Date;

  @Column({ name: 'exit_time', type: 'timestamp', nullable: true })
  exitTime: Date;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.ACTIVE,
  })
  status: TicketStatus;

  @Column({ name: 'parking_duration_minutes', nullable: true })
  parkingDurationMinutes: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    name: 'payment_method',
    nullable: true,
  })
  paymentMethod: PaymentMethod;

  @Column({ name: 'is_paid', default: false })
  isPaid: boolean;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
