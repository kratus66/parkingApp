import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Company } from '../modules/companies/entities/company.entity';
import { Customer } from './customer.entity';
import { User } from '../modules/users/entities/user.entity';

export enum ConsentChannel {
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
}

export enum ConsentStatus {
  GRANTED = 'GRANTED',
  REVOKED = 'REVOKED',
}

export enum ConsentSource {
  IN_PERSON = 'IN_PERSON',
  WEB = 'WEB',
  CALLCENTER = 'CALLCENTER',
  OTHER = 'OTHER',
}

@Entity('consents')
@Index(['customerId', 'channel'])
@Index(['status'])
export class Consent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ type: 'uuid', name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => Customer, (customer) => customer.consents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({
    type: 'enum',
    enum: ConsentChannel,
  })
  channel: ConsentChannel;

  @Column({
    type: 'enum',
    enum: ConsentStatus,
  })
  status: ConsentStatus;

  @Column({
    type: 'enum',
    enum: ConsentSource,
  })
  source: ConsentSource;

  @Column({ type: 'text', nullable: true, name: 'evidence_text' })
  evidenceText: string;

  @Column({ type: 'timestamp', nullable: true, name: 'granted_at' })
  grantedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'revoked_at' })
  revokedAt: Date;

  @Column({ type: 'uuid', name: 'actor_user_id' })
  actorUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'actor_user_id' })
  actorUser: User;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
