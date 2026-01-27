import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum NotificationType {
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

@Entity('notification_logs')
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'session_id' })
  sessionId: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    enumName: 'notification_type_enum',
  })
  type: NotificationType;

  @Column('varchar', { length: 255 })
  recipient: string;

  @Column('varchar', { length: 255, nullable: true })
  subject?: string;

  @Column('text')
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    enumName: 'notification_status_enum',
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Column('text', { name: 'error_message', nullable: true })
  errorMessage?: string;

  @CreateDateColumn({ name: 'sent_at' })
  sentAt: Date;
}