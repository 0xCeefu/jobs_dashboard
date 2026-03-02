CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS applied_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_uuid uuid NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_applied_jobs_user_job UNIQUE (user_id, job_uuid),
  CONSTRAINT fk_applied_jobs_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_applied_jobs_job
    FOREIGN KEY (job_uuid) REFERENCES job_listings(uuid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_applied_jobs_user_id ON applied_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_applied_jobs_job_uuid ON applied_jobs(job_uuid);
