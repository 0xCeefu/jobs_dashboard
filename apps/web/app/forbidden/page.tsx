import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <section className="panel stack text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-500 dark:bg-rose-900 dark:text-rose-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
          </div>
          <div>
            <h1 className="text-5xl font-black text-slate-200 dark:text-slate-700">403</h1>
            <h2 className="text-xl font-bold">Access Forbidden</h2>
            <p className="muted mt-1">You don&apos;t have permission to view this page.</p>
          </div>
          <Link className="btn primary" href="/">
            Back to jobs
          </Link>
        </div>
      </section>
    </div>
  );
}
