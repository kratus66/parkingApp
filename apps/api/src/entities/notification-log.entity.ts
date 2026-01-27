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
import { Vehicle } from './vehicle.entity';
import { ParkingSession } from './parking-session.entity';

export enum NotificationChannel {
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
}

export enum NotificationTemplate {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
  INVOICE = 'INVOICE',
}

export enum NotificationStatus {
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

@Entity('notification_logs')
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'company_id' })
  companyId: string;

  @Column('uuid', { name: 'parking_lot_id' })
  parkingLotId: string;

  @Column('uuid', { name: 'customer_id', nullable: true })
  customerId: string | null;

  @Column('uuid', { name: 'vehicle_id', nullable: true })
  vehicleId: string | null;

  @Column('uuid', { name: 'parking_session_id', nullable: true })
  parkingSessionId: string | null;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    enumName: 'notification_channel_enum',
  })
  channel: NotificationChannel;

  @Column('varchar', { length: 255 })
  to: string;

  @Column({
    type: 'enum',
    enum: NotificationTemplate,
    enumName: 'notification_template_enum',
  })
  template: NotificationTemplate;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.QUEUED,
    enumName: 'notification_status_enum',
  })
  status: NotificationStatus;

  @Column('varchar', { length: 100, default: 'mock' })
  provider: string;

  @Column('text', { name: 'error_message', nullable: true })
  errorMessage: string | null;

  @Column('jsonb', { nullable: true })
  payload: any;

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

  @ManyToOne(() => Vehicle, { nullable: true })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @ManyToOne(() => ParkingSession, { nullable: true })
  @JoinColumn({ name: 'parking_session_id' })
  parkingSession: ParkingSession;
}
