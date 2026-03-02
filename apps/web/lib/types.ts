export type UserRole = 'user' | 'admin';

export type AuthResponse = {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  accessToken: string;
  refreshToken: string;
};

export type User = {
  id: string;
  username: string;
  email: string;
  role: UserRole;
};

export type JobListingPreview = {
  uuid: string;
  source: string;
  remote: boolean;
  expires_in: string;
  type_of_job: string;
  verification_status: string;
  confidence_level: number | null;
  created_at: string;
  job_text_preview: string;
};

export type JobListingFull = {
  uuid: string;
  source: string;
  remote: boolean;
  expires_in: string;
  type_of_job: string;
  verification_status: string;
  confidence_level: number | null;
  created_at: string;
  job_link: string;
  job_text: string;
  applied?: boolean;
};

export type AppliedJobEntry = {
  applied_at: string;
  job: JobListingPreview;
};

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};
