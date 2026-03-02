import { clearSession, getAccessToken, getRefreshToken, setSession } from './session';
import type { AuthResponse } from './types';

const API_URL = process.env.API_URL ?? 'http://localhost:5173';
let refreshInFlight: Promise<AuthResponse | null> | null = null;

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`API request failed: ${status}`);
    this.status = status;
    this.body = body;
  }
}

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

async function safelySetSession(auth: AuthResponse) {
  try {
    await setSession(auth);
  } catch {
    // Server Components cannot mutate cookies. Ignore and continue.
  }
}

async function safelyClearSession() {
  try {
    await clearSession();
  } catch {
    // Server Components cannot mutate cookies. Ignore and continue.
  }
}

async function refreshAccessToken(): Promise<AuthResponse | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      await safelyClearSession();
      return null;
    }

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      await safelyClearSession();
      return null;
    }

    const body = (await response.json()) as AuthResponse;
    await safelySetSession(body);
    return body;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

type ApiFetchOptions = {
  auth?: boolean;
  retryOnUnauthorized?: boolean;
  accessTokenOverride?: string;
};

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { auth = false, retryOnUnauthorized = true, accessTokenOverride } = options;
  const headers = new Headers(init?.headers ?? {});

  if (auth) {
    const accessToken = accessTokenOverride ?? (await getAccessToken());
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  if (response.status === 401 && auth && retryOnUnauthorized) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetch<T>(path, init, {
        auth,
        retryOnUnauthorized: false,
        accessTokenOverride: refreshed.accessToken,
      });
    }
  }

  if (!response.ok) {
    const body = await parseResponseBody(response);
    throw new ApiError(response.status, body);
  }

  return (await parseResponseBody(response)) as T;
}

export function getApiUrl() {
  return API_URL;
}
