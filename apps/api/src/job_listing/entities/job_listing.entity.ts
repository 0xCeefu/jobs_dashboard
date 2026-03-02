import type { UUID } from 'crypto';
import { Column, Entity, PrimaryGeneratedColumn, Timestamp } from 'typeorm';
import { JobType } from '../enums/job.enum';
import { VerificationStatus } from '../enums/verification.enum';

@Entity('job_listings')
export class JobListing {
  @PrimaryGeneratedColumn('uuid')
  uuid: UUID;

  @Column({ nullable: false })
  source: string;

  @Column({ default: false, nullable: false })
  remote: boolean;

  @Column({ nullable: false })
  expires_in: Date;

  @Column({ nullable: false })
  type_of_job: JobType;

  @Column({ nullable: false })
  verification_status: VerificationStatus;

  @Column({ nullable: true, precision: 5, scale: 4, type: 'numeric' })
  confidence_level: number | null;

  @Column({ default: () => 'CURRENT_TIMESTAMP', nullable: false })
  created_at: Date;

  @Column({ nullable: false })
  job_link: string;

  @Column({ nullable: false, default: 'tweet text' })
  job_text: string;
}
