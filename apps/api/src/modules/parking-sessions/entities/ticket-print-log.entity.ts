import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum PrintType {
  ORIGINAL = 'ORIGINAL',
  REPRINT = 'REPRINT',
}

@Entity('ticket_print_logs')
export class TicketPrintLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'session_id' })
  sessionId: string;

  @Column('text', { name: 'ticket_content' })
  ticketContent: string;

  @Column({
    type: 'enum',
    enum: PrintType,
    enumName: 'print_type_enum',
    name: 'print_type',
  })
  printType: PrintType;

  @Column('uuid', { name: 'operator_id' })
  operatorId: string;

  @CreateDateColumn({ name: 'printed_at' })
  printedAt: Date;
}