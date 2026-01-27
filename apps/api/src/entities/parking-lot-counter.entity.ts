import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ParkingLot } from '../modules/parking-lots/entities/parking-lot.entity';

@Entity('parking_lot_counters')
export class ParkingLotCounter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'parking_lot_id', unique: true })
  parkingLotId: string;

  @Column('int', { name: 'next_ticket_number', default: 1 })
  nextTicketNumber: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => ParkingLot)
  @JoinColumn({ name: 'parking_lot_id' })
  parkingLot: ParkingLot;
}
