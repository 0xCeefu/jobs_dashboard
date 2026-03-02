'use client';

import { useEffect } from 'react';
import { AlertCircleIcon } from './icons';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
        <AlertCircleIcon size={32} />
      </div>
      <div className="stack items-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="muted max-w-md text-sm">
          An unexpected error occurred. This may be a temporary issue — please try again.
        </p>
        {error.digest && (
          <p className="font-mono text-xs text-slate-400">Digest: {error.digest}</p>
        )}
      </div>
      <button className="btn primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
