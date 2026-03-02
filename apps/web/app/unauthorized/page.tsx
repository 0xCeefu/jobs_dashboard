import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <section className="panel stack text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-500 dark:bg-amber-900 dark:text-amber-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div>
            <h1 className="text-5xl font-black text-slate-200 dark:text-slate-700">401</h1>
            <h2 className="text-xl font-bold">Session Expired</h2>
            <p className="muted mt-1">Your session is missing or has expired. Please sign in again.</p>
          </div>
          <Link className="btn primary" href="/user/login">
            Go to login
          </Link>
        </div>
      </section>
    </div>
  );
}
