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
import { TariffPlan } from './tariff-plan.entity';

export enum VehicleType {
  BICYCLE = 'BICYCLE',
  MOTORCYCLE = 'MOTORCYCLE',
  CAR = 'CAR',
  TRUCK_BUS = 'TRUCK_BUS',
}

export enum DayType {
  WEEKDAY = 'WEEKDAY',
  WEEKEND = 'WEEKEND',
  HOLIDAY = 'HOLIDAY',
}

export enum PeriodType {
  DAY = 'DAY',
  NIGHT = 'NIGHT',
}

export enum BillingUnit {
  MINUTE = 'MINUTE',
  BLOCK_15 = 'BLOCK_15',
  BLOCK_30 = 'BLOCK_30',
  HOUR = 'HOUR',
  DAY = 'DAY',
}

export enum RoundingType {
  CEIL = 'CEIL',
  FLOOR = 'FLOOR',
  NEAREST = 'NEAREST',
}

@Entity('tariff_rules')
export class TariffRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'company_id' })
  companyId: string;

  @Column('uuid', { name: 'parking_lot_id' })
  parkingLotId: string;

  @Column('uuid', { name: 'tariff_plan_id' })
  tariffPlanId: string;

  @Column({
    type: 'enum',
    enum: VehicleType,
    name: 'vehicle_type',
  })
  vehicleType: VehicleType;

  @Column({
    type: 'enum',
    enum: DayType,
    name: 'day_type',
  })
  dayType: DayType;

  @Column({
    type: 'enum',
    enum: PeriodType,
  })
  period: PeriodType;

  @Column('varchar', { name: 'start_time', length: 5 })
  startTime: string; // HH:mm

  @Column('varchar', { name: 'end_time', length: 5 })
  endTime: string; // HH:mm

  @Column({
    type: 'enum',
    enum: BillingUnit,
    name: 'billing_unit',
  })
  billingUnit: BillingUnit;

  @Column('int', { name: 'unit_price' })
  unitPrice: number; // en COP (integer)

  @Column('int', { name: 'minimum_charge', nullable: true })
  minimumCharge: number | null;

  @Column('int', { name: 'daily_max', nullable: true })
  dailyMax: number | null;

  @Column('int', { name: 'grace_minutes', nullable: true })
  graceMinutes: number | null;

  @Column({
    type: 'enum',
    enum: RoundingType,
    default: RoundingType.CEIL,
  })
  rounding: RoundingType;

  @Column('boolean', { name: 'is_active', default: true })
  isActive: boolean;

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

  @ManyToOne(() => TariffPlan, (plan) => plan.rules)
  @JoinColumn({ name: 'tariff_plan_id' })
  tariffPlan: TariffPlan;
}
