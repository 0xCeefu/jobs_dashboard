import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ApiError, apiFetch } from '../../../lib/api';
import type { PaginatedResult, User } from '../../../lib/types';
import { createUserAction, deleteUserAction, updateUserAction } from './actions';
import {
  ShieldCheckIcon,
  UserPlusIcon,
  PencilIcon,
  Trash2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  AlertCircleIcon,
} from '../../icons';

const PAGE_SIZE = 10;

type AdminUsersProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function AdminUsers({ searchParams }: AdminUsersProps) {
  const params = await searchParams;
  const page = Math.max(toPositiveInt(params.page, 1), 1);

  let users: User[];
  let totalPages = 1;

  try {
    // Try paginated endpoint first; fall back to plain array for APIs that
    // don't support pagination yet.
    const result = await apiFetch<PaginatedResult<User> | User[]>(
      `/users?page=${page}&limit=${PAGE_SIZE}`,
      undefined,
      { auth: true },
    );

    if (Array.isArray(result)) {
      // API returned all users at once – no server-side pagination
      users = result;
    } else {
      users = result.items;
      totalPages = Math.max(Math.ceil(result.total / result.limit), 1);
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect('/user/login?next=/admin/users&error=Session%20expired.%20Please%20log%20in%20again.');
    }
    if (error instanceof ApiError && error.status === 403) {
      redirect('/forbidden');
    }
    throw error;
  }

  const currentPage = Math.min(page, totalPages);
  const error = params.error;

  return (
    <div className="stack">
      {/* ── Page header ── */}
      <section className="panel">
        <div className="page-header">
          <div>
            <h1 className="flex items-center gap-2">
              <ShieldCheckIcon size={20} /> Admin: Users
            </h1>
            <p className="muted mt-1">Create, update role, and remove user accounts.</p>
          </div>
          <span className="badge amber shrink-0">{users.length} shown</span>
        </div>
        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
            <AlertCircleIcon size={15} />
            {error}
          </div>
        )}
      </section>

      {/* ── Create user ── */}
      <section className="panel stack">
        <h2 className="flex items-center gap-2">
          <UserPlusIcon size={16} /> Create User
        </h2>
        <form className="flex flex-wrap items-end gap-2" action={createUserAction}>
          <input name="username" placeholder="username" required className="flex-1" style={{ minWidth: 120 }} />
          <input name="email" type="email" placeholder="email" required className="flex-1" style={{ minWidth: 160 }} />
          <input name="password" type="password" placeholder="password" minLength={6} required className="flex-1" style={{ minWidth: 120 }} />
          <select name="role" defaultValue="user" style={{ minWidth: 110 }}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button className="btn primary shrink-0" type="submit">
            <UserPlusIcon size={14} /> Create
          </button>
        </form>
      </section>

      {/* ── Users table ── */}
      <section className="panel overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                      <UserIcon size={13} />
                    </div>
                    <span className="font-medium text-sm">{user.username}</span>
                  </div>
                </td>
                <td className="text-sm text-slate-600 dark:text-slate-400">{user.email}</td>
                <td>
                  <span className={`badge ${user.role === 'admin' ? 'amber' : 'info'}`}>
                    <ShieldCheckIcon size={10} /> {user.role}
                  </span>
                </td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    <form className="flex flex-wrap items-center gap-1" action={updateUserAction}>
                      <input type="hidden" name="id" value={user.id} />
                      <input name="username" defaultValue={user.username} required className="text-xs" style={{ width: 100 }} />
                      <input name="email" defaultValue={user.email} type="email" required className="text-xs" style={{ width: 140 }} />
                      <select name="role" defaultValue={user.role} className="text-xs" style={{ width: 90 }}>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button className="btn shrink-0" type="submit">
                        <PencilIcon size={13} /> Save
                      </button>
                    </form>
                    <form action={deleteUserAction}>
                      <input type="hidden" name="id" value={user.id} />
                      <button className="btn danger" type="submit">
                        <Trash2Icon size={13} /> Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <section className="panel">
          <div className="row">
            {currentPage > 1 ? (
              <Link className="btn" href={`/admin/users?page=${currentPage - 1}`}>
                <ChevronLeftIcon size={14} /> Previous
              </Link>
            ) : (
              <span className="btn" aria-disabled="true"><ChevronLeftIcon size={14} /> Previous</span>
            )}
            <span className="muted text-sm">Page {currentPage} of {totalPages}</span>
            {currentPage < totalPages ? (
              <Link className="btn" href={`/admin/users?page=${currentPage + 1}`}>
                Next <ChevronRightIcon size={14} />
              </Link>
            ) : (
              <span className="btn" aria-disabled="true">Next <ChevronRightIcon size={14} /></span>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function toPositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}
