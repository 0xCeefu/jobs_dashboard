'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ApiError, apiFetch } from '../../../lib/api';
import type { User, UserRole } from '../../../lib/types';

function toMessage(error: unknown) {
  if (error instanceof ApiError) {
    const body = error.body as { message?: string };
    return body?.message ?? `Request failed (${error.status})`;
  }
  return 'Something went wrong';
}

export async function createUserAction(formData: FormData) {
  const username = String(formData.get('username') ?? '');
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const role = String(formData.get('role') ?? 'user') as UserRole;

  try {
    await apiFetch<User>(
      '/users',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, role }),
      },
      { auth: true },
    );
    revalidatePath('/admin/users');
  } catch (error) {
    redirect(`/admin/users?error=${encodeURIComponent(toMessage(error))}`);
  }

  redirect('/admin/users');
}

export async function updateUserAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const username = String(formData.get('username') ?? '');
  const email = String(formData.get('email') ?? '');
  const role = String(formData.get('role') ?? 'user') as UserRole;

  try {
    await apiFetch<User>(
      `/users/${id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, role }),
      },
      { auth: true },
    );
    revalidatePath('/admin/users');
  } catch (error) {
    redirect(`/admin/users?error=${encodeURIComponent(toMessage(error))}`);
  }
}

export async function deleteUserAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');

  try {
    await apiFetch<{ message: string }>(
      `/users/${id}`,
      {
        method: 'DELETE',
      },
      { auth: true },
    );
    revalidatePath('/admin/users');
  } catch (error) {
    redirect(`/admin/users?error=${encodeURIComponent(toMessage(error))}`);
  }
}
