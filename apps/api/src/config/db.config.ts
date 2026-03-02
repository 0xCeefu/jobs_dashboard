import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions.js';
import { JobListing } from 'src/job_listing/entities/job_listing.entity';
import { AppliedJob } from 'src/job_listing/entities/applied_job.entity';
import { User } from 'src/users/entities/user.entity';

export default (): PostgresConnectionOptions => ({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  // host: process.env.DB_HOST ?? 'localhost',
  port: +(process.env.DB_PORT ?? 5432),
  logging: ['error', 'warn'],
  synchronize: false,
  entities: [JobListing, AppliedJob, User],
});
