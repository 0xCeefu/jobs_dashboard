import type { UUID } from 'crypto';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { JobListing } from './job_listing.entity';

@Entity('applied_jobs')
@Unique(['user_id', 'job_uuid'])
export class AppliedJob {
  @PrimaryGeneratedColumn('uuid')
  id: UUID;

  @Column({ type: 'uuid' })
  user_id: UUID;

  @Column({ type: 'uuid' })
  job_uuid: UUID;

  @CreateDateColumn({ type: 'timestamptz' })
  applied_at: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => JobListing, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_uuid', referencedColumnName: 'uuid' })
  job: JobListing;
}
