'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { ApiError, apiFetch } from '../../lib/api';
import { clearSession, setSession } from '../../lib/session';
import { markJobApplied, unmarkJobApplied } from '../../lib/jobs';
import type { AuthResponse } from '../../lib/types';

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const body = error.body as { message?: string };
    return body?.message ?? `Request failed (${error.status})`;
  }
  return 'Something went wrong.';
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('next') ?? '/');
  const destination = next && next.startsWith('/') ? next : '/';

  try {
    const auth = await apiFetch<AuthResponse>(
      '/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      },
      { auth: false },
    );
    await setSession(auth);
    revalidatePath('/');
  } catch (error) {
    redirect(
      `/user/login?error=${encodeURIComponent(getErrorMessage(error))}&next=${encodeURIComponent(destination)}`,
    );
  }

  redirect(destination);
}

export async function signupAction(formData: FormData) {
  const username = String(formData.get('username') ?? '');
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('next') ?? '/');
  const destination = next && next.startsWith('/') ? next : '/';

  try {
    const auth = await apiFetch<AuthResponse>(
      '/auth/register',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      },
      { auth: false },
    );
    await setSession(auth);
    revalidatePath('/');
  } catch (error) {
    redirect(`/user/signup?error=${encodeURIComponent(getErrorMessage(error))}&next=${encodeURIComponent(destination)}`);
  }

  redirect(destination);
}

export async function logoutAction() {
  await clearSession();
  revalidatePath('/');
  redirect('/user/login');
}

export async function toggleAppliedJobAction(formData: FormData) {
  const jobId = String(formData.get('jobId') ?? '');
  const intent = String(formData.get('intent') ?? 'apply');
  const next = String(formData.get('next') ?? '/');
  const destination = next && next.startsWith('/') ? next : '/';

  if (!jobId) {
    redirect(destination);
  }

  try {
    if (intent === 'unapply') {
      await unmarkJobApplied(jobId);
    } else {
      await markJobApplied(jobId);
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect(
        `/user/login?next=${encodeURIComponent(destination)}&error=${encodeURIComponent(
          'Session expired. Please log in again.',
        )}`,
      );
    }
  }

  revalidatePath('/');
  revalidatePath('/user/profile');
  revalidatePath('/jobs/[id]', 'page');
  if (destination !== '/') {
    revalidatePath(destination);
  }

  redirect(destination);
}
