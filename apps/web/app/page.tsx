import Link from 'next/link';
import { ApiError } from '../lib/api';
import { hasAuthSession } from '../lib/session';
import { getPrivateJobs, getPublicJobs, type JobFilters } from '../lib/jobs';
import type { JobListingFull, JobListingPreview, PaginatedResult } from '../lib/types';
import { toggleAppliedJobAction } from './user/actions';
import {
  FilterIcon,
  GlobeIcon,
  BuildingIcon,
  CalendarIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LockIcon,
  BriefcaseIcon,
  AlertCircleIcon,
  ClockIcon,
  ZapIcon,
} from './icons';

type HomePageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

function isExpired(expiresIn: string) {
  return new Date(expiresIn).getTime() < Date.now();
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleDateString();
}

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const page = toPositiveInt(params.page, 1);
  const pageSize = 40;
  const filterFields: Pick<JobFilters, 'remote' | 'type_of_job' | 'verification_status'> = {
    remote: params.remote,
    type_of_job: params.type_of_job,
    verification_status: params.verification_status,
  };
  const filters: JobFilters = {
    ...filterFields,
    page: String(page),
    limit: String(pageSize),
  };

  const hasSession = await hasAuthSession();
  let hasPrivateAccess = hasSession;
  let jobsResult: PaginatedResult<JobListingFull | JobListingPreview>;
  if (hasSession) {
    try {
      jobsResult = await getPrivateJobs(filters);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        hasPrivateAccess = false;
        jobsResult = await getPublicJobs(filters);
      } else {
        throw error;
      }
    }
  } else {
    jobsResult = await getPublicJobs(filters);
  }
  const jobs = jobsResult.items;
  const totalPages = Math.max(Math.ceil(jobsResult.total / jobsResult.limit), 1);
  const currentPage = Math.min(Math.max(jobsResult.page, 1), totalPages);
  const prevPageHref = buildJobsPageHref({ ...filterFields, page: String(Math.max(currentPage - 1, 1)) });
  const nextPageHref = buildJobsPageHref({
    ...filterFields,
    page: String(Math.min(currentPage + 1, totalPages)),
  });
  const pageStart = Math.max(1, currentPage - 2);
  const pageEnd = Math.min(totalPages, currentPage + 2);
  const pageNumbers = Array.from({ length: pageEnd - pageStart + 1 }, (_, index) => pageStart + index);
  const currentPageHref = buildJobsPageHref({
    ...filterFields,
    page: String(currentPage),
  });

  return (
    <div className="stack">
      {/* ── Header + filters ── */}
      <section className="panel stack">
        <div className="page-header">
          <div>
            <h1 className="flex items-center gap-2">
              <BriefcaseIcon size={22} /> Job Listings
            </h1>
            <p className="muted mt-1">
              {hasPrivateAccess
                ? `Showing full listings — ${jobsResult.total} total`
                : 'Viewing guest previews. Log in to unlock full text and apply links.'}
            </p>
          </div>
          {!hasPrivateAccess && (
            <Link className="btn primary shrink-0" href="/user/login">
              <LockIcon size={13} /> Log in
            </Link>
          )}
        </div>

        <form className="flex flex-wrap items-center gap-2" action="/">
          <input type="hidden" name="page" value="1" />
          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
            <FilterIcon size={13} /> Filters
          </div>
          <select name="remote" defaultValue={params.remote ?? ''}>
            <option value="">Remote / Onsite</option>
            <option value="true">Remote</option>
            <option value="false">Onsite</option>
          </select>
          <select name="type_of_job" defaultValue={params.type_of_job ?? ''}>
            <option value="">All Job Types</option>
            <option value="frontend">Frontend</option>
            <option value="backend">Backend</option>
            <option value="fullstack">Fullstack</option>
          </select>
          <select name="verification_status" defaultValue={params.verification_status ?? ''}>
            <option value="">All Verifications</option>
            <option value="ai">AI Verified</option>
            <option value="threshold">Threshold</option>
          </select>
          <button className="btn primary" type="submit">
            Apply
          </button>
          {(params.remote || params.type_of_job || params.verification_status) && (
            <Link className="btn" href="/">Clear</Link>
          )}
        </form>
        <p className="muted text-xs">
          Page {currentPage} of {totalPages} &mdash; {jobs.length} of {jobsResult.total} jobs
        </p>
      </section>

      {/* ── Job cards ── */}
      <section className="grid jobs-grid">
        {jobs.length === 0 && (
          <div className="panel col-span-full">
            <div className="empty-state">
              <div className="empty-state-icon"><BriefcaseIcon size={28} /></div>
              <p className="font-medium">No listings match your filters</p>
              <p className="muted">Try clearing or adjusting your search criteria.</p>
              <Link className="btn" href="/">Clear filters</Link>
            </div>
          </div>
        )}

        {jobs.map((job) => {
          const expired = isExpired(job.expires_in);
          const jobType = job.type_of_job?.toLowerCase();
          const typeBadgeClass =
            jobType === 'frontend' ? 'info'
            : jobType === 'backend' ? 'purple'
            : jobType === 'fullstack' ? 'success'
            : '';
          return (
            <article className="panel panel-hover stack" key={job.uuid}>
              <div className="row">
                <span className={`badge ${expired ? 'danger' : 'success'}`}>
                  {expired ? <AlertCircleIcon size={11} /> : <CheckCircleIcon size={11} />}
                  {expired ? 'Expired' : 'Active'}
                </span>
                <span className={`badge ${typeBadgeClass}`}>{job.type_of_job}</span>
                <span className="badge">
                  {job.remote ? <GlobeIcon size={11} /> : <BuildingIcon size={11} />}
                  {job.remote ? 'Remote' : 'Onsite'}
                </span>
                {'applied' in job && job.applied && (
                  <span className="badge success ml-auto">
                    <CheckCircleIcon size={11} /> Applied
                  </span>
                )}
              </div>

              <p className="font-semibold leading-snug text-slate-900 dark:text-slate-100">
                {job.source}
              </p>

              <p className="muted flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <CalendarIcon size={11} /> {formatDate(job.created_at)}
                </span>
                <span className="flex items-center gap-1">
                  <ClockIcon size={11} /> Exp. {formatDate(job.expires_in)}
                </span>
              </p>

              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-3">
                {'job_text' in job ? truncateText(job.job_text) : `${job.job_text_preview}...`}
              </p>

              <div className="row mt-auto pt-1">
                <Link className="btn" href={`/jobs/${job.uuid}`}>
                  View Details
                </Link>
                {hasPrivateAccess && 'applied' in job && (
                  <form action={toggleAppliedJobAction}>
                    <input type="hidden" name="jobId" value={job.uuid} />
                    <input type="hidden" name="next" value={currentPageHref} />
                    <input type="hidden" name="intent" value={job.applied ? 'unapply' : 'apply'} />
                    <button className={`btn ${job.applied ? '' : 'primary'}`} type="submit">
                      {job.applied ? 'Remove Applied' : <><CheckCircleIcon size={13} /> Mark Applied</>}
                    </button>
                  </form>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {/* ── Pagination ── */}
      <section className="panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="row">
            {currentPage > 1 ? (
              <Link className="btn" href={prevPageHref}>
                <ChevronLeftIcon size={14} /> Prev
              </Link>
            ) : (
              <span className="btn" aria-disabled="true">
                <ChevronLeftIcon size={14} /> Prev
              </span>
            )}

            {pageNumbers.map((pageNumber) => {
              const href = buildJobsPageHref({ ...filterFields, page: String(pageNumber) });
              const isCurrent = pageNumber === currentPage;
              return (
                <Link
                  key={pageNumber}
                  className={`btn ${isCurrent ? 'primary' : ''}`}
                  href={href}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {pageNumber}
                </Link>
              );
            })}

            {currentPage < totalPages ? (
              <Link className="btn" href={nextPageHref}>
                Next <ChevronRightIcon size={14} />
              </Link>
            ) : (
              <span className="btn" aria-disabled="true">
                Next <ChevronRightIcon size={14} />
              </span>
            )}
          </div>

          <form className="row" action="/">
            {filterFields.remote && <input type="hidden" name="remote" value={filterFields.remote} />}
            {filterFields.type_of_job && (
              <input type="hidden" name="type_of_job" value={filterFields.type_of_job} />
            )}
            {filterFields.verification_status && (
              <input type="hidden" name="verification_status" value={filterFields.verification_status} />
            )}
            <label htmlFor="goToPage" className="muted text-xs">
              Go to page
            </label>
            <input
              id="goToPage"
              name="page"
              type="number"
              min={1}
              max={totalPages}
              defaultValue={currentPage}
              style={{ width: 72 }}
            />
            <button className="btn" type="submit">Go</button>
          </form>
        </div>
      </section>
    </div>
  );
}

function truncateText(text: string) {
  return text.length > 180 ? `${text.slice(0, 180)}...` : text;
}

function toPositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function buildJobsPageHref(filters: JobFilters) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      query.set(key, value);
    }
  });

  const queryString = query.toString();
  return queryString ? `/?${queryString}` : '/';
}
