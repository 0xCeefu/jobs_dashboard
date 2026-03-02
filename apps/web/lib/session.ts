import { cookies } from 'next/headers';
import type { AuthResponse, UserRole } from './types';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
export const USER_ROLE_COOKIE = 'user_role';
export const USER_NAME_COOKIE = 'user_name';

const baseCookieConfig = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

export async function setSession(auth: AuthResponse) {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_TOKEN_COOKIE, auth.accessToken, {
    ...baseCookieConfig,
    maxAge: 60 * 5,
  });
  cookieStore.set(REFRESH_TOKEN_COOKIE, auth.refreshToken, {
    ...baseCookieConfig,
    maxAge: 60 * 60 * 24 * 7,
  });
  cookieStore.set(USER_ROLE_COOKIE, auth.role, {
    ...baseCookieConfig,
    maxAge: 60 * 60 * 24 * 7,
  });
  cookieStore.set(USER_NAME_COOKIE, auth.username, {
    ...baseCookieConfig,
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
  cookieStore.delete(USER_ROLE_COOKIE);
  cookieStore.delete(USER_NAME_COOKIE);
}

export async function getAccessToken() {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
}

export async function getRefreshToken() {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_TOKEN_COOKIE)?.value ?? null;
}

export async function hasAuthSession() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  return Boolean(accessToken || refreshToken);
}

export async function getUserRole(): Promise<UserRole | null> {
  const cookieStore = await cookies();
  const role = cookieStore.get(USER_ROLE_COOKIE)?.value;
  if (role === 'user' || role === 'admin') {
    return role;
  }
  return null;
}
