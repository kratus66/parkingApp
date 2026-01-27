import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Company } from '../modules/companies/entities/company.entity';
import { ParkingLot } from '../modules/parking-lots/entities/parking-lot.entity';
import { ParkingSession } from './parking-session.entity';
import { User } from '../modules/users/entities/user.entity';

export enum TicketPrintAction {
  PRINT = 'PRINT',
  REPRINT = 'REPRINT',
}

@Entity('ticket_print_logs')
export class TicketPrintLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'company_id' })
  companyId: string;

  @Column('uuid', { name: 'parking_lot_id' })
  parkingLotId: string;

  @Column('uuid', { name: 'parking_session_id' })
  parkingSessionId: string;

  @Column({
    type: 'enum',
    enum: TicketPrintAction,
    enumName: 'ticket_print_action_enum',
  })
  action: TicketPrintAction;

  @Column('uuid', { name: 'actor_user_id' })
  actorUserId: string;

  @Column('text', { nullable: true })
  reason: string | null;

  @Column('timestamp', { name: 'printed_at', default: () => 'NOW()' })
  printedAt: Date;

  @Column('varchar', { name: 'device_name', length: 255, nullable: true })
  deviceName: string | null;

  // Relations
  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => ParkingLot)
  @JoinColumn({ name: 'parking_lot_id' })
  parkingLot: ParkingLot;

  @ManyToOne(() => ParkingSession)
  @JoinColumn({ name: 'parking_session_id' })
  parkingSession: ParkingSession;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'actor_user_id' })
  actorUser: User;
}
