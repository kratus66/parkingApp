import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Company } from '../modules/companies/entities/company.entity';
import { ParkingLot } from '../modules/parking-lots/entities/parking-lot.entity';

@Entity('cash_policies')
@Index(['parkingLotId'], { unique: true })
export class CashPolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  companyId: string;

  @Column({ type: 'uuid', unique: true })
  parkingLotId: string;

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Exigir turno abierto para hacer checkout',
  })
  requireOpenShiftForCheckout: boolean;

  @Column({
    type: 'int',
    default: 8,
    comment: 'Duración default del turno en horas',
  })
  defaultShiftHours: number;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Permitir múltiples turnos abiertos por cajero',
  })
  allowMultipleOpenShiftsPerCashier: boolean;

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Permitir múltiples turnos abiertos en el mismo parqueadero',
  })
  allowMultipleOpenShiftsPerParkingLot: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @ManyToOne(() => ParkingLot)
  @JoinColumn({ name: 'parkingLotId' })
  parkingLot: ParkingLot;
}
