import { redirect } from 'next/navigation';
import { ApiError, apiFetch } from '../../../lib/api';
import { getAppliedJobs } from '../../../lib/jobs';
import type { AppliedJobEntry, PaginatedResult, User } from '../../../lib/types';
import Link from 'next/link';
import { toggleAppliedJobAction } from '../actions';
import {
  UserIcon,
  MailIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  BriefcaseIcon,
  GlobeIcon,
  BuildingIcon,
  CalendarIcon,
  Trash2Icon,
} from '../../icons';

export default async function Profile() {
  try {
    const me = await apiFetch<User>('/auth/me', undefined, { auth: true });
    let appliedJobs: PaginatedResult<AppliedJobEntry> = {
      items: [],
      page: 1,
      limit: 50,
      total: 0,
      hasMore: false,
    };

    try {
      appliedJobs = await getAppliedJobs({ page: '1', limit: '50' });
    } catch (error) {
      if (!(error instanceof ApiError)) {
        throw error;
      }
    }

    return (
      <div className="stack">
        {/* ── Profile card ── */}
        <section className="panel">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-900 dark:text-sky-400">
              <UserIcon size={28} />
            </div>
            <div className="stack gap-1">
              <h1 className="text-xl font-bold">{me.username}</h1>
              <p className="muted flex items-center gap-1.5 text-sm">
                <MailIcon size={13} /> {me.email}
              </p>
              <span className={`badge w-fit ${me.role === 'admin' ? 'amber' : 'info'}`}>
                <ShieldCheckIcon size={11} /> {me.role}
              </span>
            </div>
          </div>
        </section>

        {/* ── Applied jobs ── */}
        <section className="panel stack">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2">
              <BriefcaseIcon size={18} /> Applied Jobs
              {appliedJobs.total > 0 && (
                <span className="badge">{appliedJobs.total}</span>
              )}
            </h2>
          </div>

          {appliedJobs.items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><BriefcaseIcon size={24} /></div>
              <p className="font-medium">No applied jobs yet</p>
              <p className="muted">Mark jobs as applied to track them here.</p>
              <Link className="btn primary" href="/">
                Browse listings
              </Link>
            </div>
          ) : (
            <div className="stack">
              {appliedJobs.items.map((entry) => (
                <article
                  className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 p-3 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                  key={`${entry.job.uuid}-${entry.applied_at}`}
                >
                  <div className="stack gap-1">
                    <div className="row">
                      <span className="badge success"><CheckCircleIcon size={11} /> Applied</span>
                      <span className="badge">
                        {entry.job.type_of_job}
                      </span>
                      <span className="badge">
                        {entry.job.remote ? <GlobeIcon size={11} /> : <BuildingIcon size={11} />}
                        {entry.job.remote ? 'Remote' : 'Onsite'}
                      </span>
                    </div>
                    <p className="font-semibold text-sm">{entry.job.source}</p>
                    <p className="muted flex items-center gap-1 text-xs">
                      <CalendarIcon size={11} />
                      Applied {new Date(entry.applied_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <Link className="btn" href={`/jobs/${entry.job.uuid}`}>
                      View
                    </Link>
                    <form action={toggleAppliedJobAction}>
                      <input type="hidden" name="jobId" value={entry.job.uuid} />
                      <input type="hidden" name="intent" value="unapply" />
                      <input type="hidden" name="next" value="/user/profile" />
                      <button className="btn danger w-full" type="submit">
                        <Trash2Icon size={13} /> Remove
                      </button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect('/user/login?next=/user/profile&error=Session%20expired.%20Please%20log%20in%20again.');
    }

    throw error;
  }
}
