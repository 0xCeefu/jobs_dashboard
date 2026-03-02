import Link from 'next/link';
import { ApiError } from '../../../lib/api';
import { hasAuthSession } from '../../../lib/session';
import { getPrivateJobById, getPublicJobById } from '../../../lib/jobs';
import { toggleAppliedJobAction } from '../../user/actions';
import {
  GlobeIcon,
  BuildingIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
  LockIcon,
  AlertCircleIcon,
  CalendarIcon,
  ClockIcon,
  ZapIcon,
  UserPlusIcon,
  LogInIcon,
} from '../../icons';

type JobDetailProps = {
  params: Promise<{ id: string }>;
};

export default async function JobDetail({ params }: JobDetailProps) {
  const { id } = await params;
  const hasSession = await hasAuthSession();
  let job = null;

  if (hasSession) {
    try {
      job = await getPrivateJobById(id);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        job = await getPublicJobById(id);
      } else {
        throw error;
      }
    }
  } else {
    job = await getPublicJobById(id);
  }

  if (!job) {
    return (
      <section className="panel">
        <div className="empty-state">
          <div className="empty-state-icon"><AlertCircleIcon size={28} /></div>
          <h1>Listing Not Found</h1>
          <p className="muted">The listing may have been removed.</p>
          <Link className="btn" href="/">Back to listings</Link>
        </div>
      </section>
    );
  }

  const expired = new Date(job.expires_in).getTime() < Date.now();
  const jobType = job.type_of_job?.toLowerCase();
  const typeBadgeClass =
    jobType === 'frontend' ? 'info'
    : jobType === 'backend' ? 'purple'
    : jobType === 'fullstack' ? 'success'
    : '';

  return (
    <div className="stack">
      <section className="panel stack">
        {/* Status row */}
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

        {/* Title */}
        <h1 className="text-2xl font-bold leading-tight">{job.source}</h1>

        {/* Meta row */}
        <div className="row text-sm text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <ZapIcon size={13} />
            Verified: {job.verification_status}
            {job.confidence_level !== null && ` (${job.confidence_level}%)`}
          </span>
          <span className="flex items-center gap-1.5">
            <ClockIcon size={13} />
            Expires {new Date(job.expires_in).toLocaleDateString()}
          </span>
        </div>

        <hr className="border-slate-200 dark:border-slate-800" />

        {'job_text' in job ? (
          <>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{job.job_text}</p>

            <div className="row pt-2">
              {'applied' in job && (
                <form action={toggleAppliedJobAction}>
                  <input type="hidden" name="jobId" value={job.uuid} />
                  <input type="hidden" name="next" value={`/jobs/${job.uuid}`} />
                  <input type="hidden" name="intent" value={job.applied ? 'unapply' : 'apply'} />
                  <button className={`btn ${job.applied ? '' : 'primary'}`} type="submit">
                    {job.applied
                      ? 'Remove Applied'
                      : <><CheckCircleIcon size={14} /> Mark as Applied</>}
                  </button>
                </form>
              )}
              <a className="btn primary" href={job.job_link} target="_blank" rel="noreferrer">
                <ExternalLinkIcon size={14} /> Open Application
              </a>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm leading-relaxed">{job.job_text_preview}...</p>

            <section className="panel stack bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400">
                  <LockIcon size={18} />
                </div>
                <div>
                  <h2 className="font-semibold">Full listing requires login</h2>
                  <p className="muted text-xs">Sign in to see the full description and apply link.</p>
                </div>
              </div>
              <div className="row">
                <Link className="btn primary" href={`/user/login?next=/jobs/${job.uuid}`}>
                  <LogInIcon size={14} /> Login
                </Link>
                <Link className="btn" href="/user/signup">
                  <UserPlusIcon size={14} /> Create account
                </Link>
              </div>
            </section>
          </>
        )}
      </section>
    </div>
  );
}
