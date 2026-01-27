import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ParkingSessionStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  CANCELED = 'CANCELED',
}

export enum VehicleType {
  CAR = 'CAR',
  MOTORCYCLE = 'MOTORCYCLE',
  BICYCLE = 'BICYCLE',
  TRUCK = 'TRUCK',
}

@Entity('parking_sessions')
export class ParkingSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'parking_lot_id' })
  parkingLotId: string;

  @Column('uuid', { name: 'spot_id' })
  spotId: string;

  @Column('varchar', { name: 'vehicle_plate', length: 20 })
  vehiclePlate: string;

  @Column({
    type: 'enum',
    enum: VehicleType,
    enumName: 'vehicle_type_enum',
    name: 'vehicle_type',
  })
  vehicleType: VehicleType;

  @Column('varchar', { name: 'ticket_number', unique: true, length: 50 })
  ticketNumber: string;

  @Column('timestamp', { name: 'check_in_time', default: () => 'NOW()' })
  checkInTime: Date;

  @Column('timestamp', { name: 'check_out_time', nullable: true })
  checkOutTime?: Date;

  @Column('int', { name: 'duration_minutes', nullable: true })
  durationMinutes?: number;

  @Column({
    type: 'enum',
    enum: ParkingSessionStatus,
    enumName: 'parking_session_status_enum',
    default: ParkingSessionStatus.ACTIVE,
  })
  status: ParkingSessionStatus;

  @Column('uuid', { name: 'operator_id' })
  operatorId: string;

  @Column('uuid', { name: 'check_out_operator_id', nullable: true })
  checkOutOperatorId?: string;

  @Column('varchar', { name: 'phone_number', nullable: true, length: 20 })
  phoneNumber?: string;

  @Column('varchar', { name: 'email', nullable: true, length: 100 })
  email?: string;

  @Column('text', { nullable: true })
  notes?: string;

  @Column('timestamp', { name: 'canceled_at', nullable: true })
  canceledAt?: Date;

  @Column('text', { name: 'cancel_reason', nullable: true })
  cancelReason?: string;

  @Column('uuid', { name: 'canceled_by_id', nullable: true })
  canceledById?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}