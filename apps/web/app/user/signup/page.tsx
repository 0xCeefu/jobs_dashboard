import Link from 'next/link';
import { getApiUrl } from '../../../lib/api';
import { signupAction } from '../actions';
import { UserPlusIcon, UserIcon, MailIcon, KeyIcon, GoogleIcon, AlertCircleIcon } from '../../icons';

type SignupProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function Signup({ searchParams }: SignupProps) {
  const params = await searchParams;
  const error = params.error;
  const next = params.next ?? '/';
  const googleSignupHref = `${getApiUrl()}/auth/google/login?next=${encodeURIComponent(next)}`;

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <section className="panel stack w-full" style={{ maxWidth: 420 }}>
        <div className="flex flex-col items-center gap-2 pb-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-900 dark:text-sky-400">
            <UserPlusIcon size={24} />
          </div>
          <h1 className="text-2xl font-bold">Create account</h1>
          <p className="muted">Find your next opportunity</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
            <AlertCircleIcon size={15} />
            {error}
          </div>
        )}

        <form className="inline-form" action={signupAction}>
          <input type="hidden" name="next" value={next} />
          <div className="form-group">
            <label htmlFor="username" className="flex items-center gap-1.5">
              <UserIcon size={13} /> Username
            </label>
            <input id="username" name="username" placeholder="yourname" required />
          </div>
          <div className="form-group">
            <label htmlFor="email" className="flex items-center gap-1.5">
              <MailIcon size={13} /> Email
            </label>
            <input id="email" name="email" type="email" placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label htmlFor="password" className="flex items-center gap-1.5">
              <KeyIcon size={13} /> Password
            </label>
            <input id="password" name="password" type="password" placeholder="••••••••" required minLength={6} />
          </div>
          <button className="btn primary mt-1 w-full py-2" type="submit">
            <UserPlusIcon size={15} /> Create account
          </button>
        </form>

        <div className="divider">or</div>

        <a className="btn w-full py-2" href={googleSignupHref}>
          <GoogleIcon size={16} /> Sign up with Google
        </a>

        <p className="muted text-center text-sm">
          Already have an account?{' '}
          <Link href={`/user/login?next=${encodeURIComponent(next)}`} className="font-medium text-sky-600 hover:underline dark:text-sky-400">
            Sign in
          </Link>
        </p>
      </section>
    </div>
  );
}
