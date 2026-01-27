import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('holidays')
@Index(['country', 'date'], { unique: true })
export class Holiday {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 2, default: 'CO' })
  country: string;

  @Column('date')
  date: string; // YYYY-MM-DD

  @Column('varchar', { length: 100 })
  name: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
