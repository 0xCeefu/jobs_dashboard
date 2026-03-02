import { apiFetch } from './api';
import type { AppliedJobEntry, JobListingFull, JobListingPreview, PaginatedResult } from './types';

export type JobFilters = {
  remote?: string;
  type_of_job?: string;
  verification_status?: string;
  page?: string;
  limit?: string;
};

function toQueryString(filters: JobFilters) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      query.set(key, value);
    }
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

export async function getPublicJobs(filters: JobFilters) {
  return apiFetch<PaginatedResult<JobListingPreview>>(`/job-listing/public${toQueryString(filters)}`);
}

export async function getPrivateJobs(filters: JobFilters) {
  return apiFetch<PaginatedResult<JobListingFull>>(
    `/job-listing${toQueryString(filters)}`,
    undefined,
    { auth: true },
  );
}

export async function getPublicJobById(id: string) {
  return apiFetch<JobListingPreview | null>(`/job-listing/public/${id}`);
}

export async function getPrivateJobById(id: string) {
  return apiFetch<JobListingFull | null>(`/job-listing/${id}`, undefined, { auth: true });
}

export async function markJobApplied(id: string) {
  return apiFetch<{ applied: boolean; applied_at: string; job_uuid: string }>(
    `/job-listing/${id}/apply`,
    { method: 'POST' },
    { auth: true },
  );
}

export async function unmarkJobApplied(id: string) {
  return apiFetch<{ applied: boolean; job_uuid: string }>(
    `/job-listing/${id}/apply`,
    { method: 'DELETE' },
    { auth: true },
  );
}

export async function getAppliedJobs(filters: Pick<JobFilters, 'page' | 'limit'> = {}) {
  return apiFetch<PaginatedResult<AppliedJobEntry>>(`/job-listing/applied/me${toQueryString(filters)}`, undefined, {
    auth: true,
  });
}
