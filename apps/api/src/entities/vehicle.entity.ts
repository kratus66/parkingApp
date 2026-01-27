import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Company } from '../modules/companies/entities/company.entity';
import { Ticket } from './ticket.entity';

export enum VehicleType {
  CAR = 'CAR',
  MOTORCYCLE = 'MOTORCYCLE',
  TRUCK = 'TRUCK',
  VAN = 'VAN',
  SUV = 'SUV',
}

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'license_plate', unique: true, length: 20 })
  licensePlate: string;

  @Column({
    type: 'enum',
    enum: VehicleType,
    name: 'vehicle_type',
    default: VehicleType.CAR,
  })
  vehicleType: VehicleType;

  @Column({ nullable: true, length: 50 })
  brand: string;

  @Column({ nullable: true, length: 50 })
  model: string;

  @Column({ nullable: true, length: 30 })
  color: string;

  @Column({ name: 'is_blacklisted', default: false })
  isBlacklisted: boolean;

  @Column({ name: 'blacklist_reason', nullable: true, type: 'text' })
  blacklistReason: string;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @ManyToOne(() => Company, (company) => company.vehicles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @OneToMany(() => Ticket, (ticket) => ticket.vehicle)
  tickets: Ticket[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
