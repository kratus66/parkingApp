import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ParkingSession } from './parking-session.entity';

@Entity('pricing_snapshots')
export class PricingSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @Column({ type: 'uuid', name: 'parking_lot_id' })
  parkingLotId: string;

  @Column({ type: 'uuid', name: 'parking_session_id' })
  parkingSessionId: string;

  @Column({ type: 'timestamp', name: 'entry_at' })
  entryAt: Date;

  @Column({ type: 'timestamp', name: 'exit_at' })
  exitAt: Date;

  @Column({ type: 'varchar', length: 50, name: 'vehicle_type' })
  vehicleType: string;

  @Column({ type: 'int', name: 'total_minutes' })
  totalMinutes: number;

  @Column({ type: 'jsonb', comment: 'Breakdown completo del cálculo' })
  quote: any;

  @Column({ type: 'int', comment: 'Total en COP (centavos)' })
  total: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relaciones
  @ManyToOne(() => ParkingSession)
  @JoinColumn({ name: 'parking_session_id' })
  parkingSession: ParkingSession;
}
