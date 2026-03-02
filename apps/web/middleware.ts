import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  USER_ROLE_COOKIE,
  USER_NAME_COOKIE,
} from './lib/session';

const API_URL = process.env.API_URL ?? 'http://localhost:5173';

const cookieConfig = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  role: string;
  username: string;
}

/**
 * Attempt to refresh auth tokens using the refresh token.
 * Returns the new auth payload on success, or null on failure.
 */
async function tryRefreshTokens(refreshToken: string): Promise<RefreshResult | null> {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${refreshToken}` },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as RefreshResult;
  } catch {
    return null;
  }
}

/**
 * Set refreshed auth cookies on both the request (so downstream Server
 * Components see them via `cookies()`) and the response (so the browser
 * stores them for future navigations).
 */
function buildRefreshedResponse(request: NextRequest, auth: RefreshResult) {
  // Update request cookies so Server Components read the fresh values
  request.cookies.set(ACCESS_TOKEN_COOKIE, auth.accessToken);
  request.cookies.set(REFRESH_TOKEN_COOKIE, auth.refreshToken);
  request.cookies.set(USER_ROLE_COOKIE, auth.role);
  request.cookies.set(USER_NAME_COOKIE, auth.username);

  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Set cookies on the response so the browser persists them
  response.cookies.set(ACCESS_TOKEN_COOKIE, auth.accessToken, {
    ...cookieConfig,
    maxAge: 60 * 5,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, auth.refreshToken, {
    ...cookieConfig,
    maxAge: 60 * 60 * 24 * 7,
  });
  response.cookies.set(USER_ROLE_COOKIE, auth.role, {
    ...cookieConfig,
    maxAge: 60 * 60 * 24 * 7,
  });
  response.cookies.set(USER_NAME_COOKIE, auth.username, {
    ...cookieConfig,
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}

function clearAuthCookies(response: NextResponse) {
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
  response.cookies.delete(USER_ROLE_COOKIE);
  response.cookies.delete(USER_NAME_COOKIE);
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  // ── Proactive token refresh ──────────────────────────────────────────
  // When the access token cookie has expired but the refresh token is
  // still present, refresh tokens NOW and set fresh cookies on both the
  // request (for downstream Server Components) and the response (for the
  // browser).  This is the ONLY reliable place to do it — Server
  // Components cannot mutate cookies.
  let refreshedResponse: NextResponse | null = null;

  if (!accessToken && refreshToken) {
    const auth = await tryRefreshTokens(refreshToken);

    if (auth) {
      refreshedResponse = buildRefreshedResponse(request, auth);
      // Update local variable so the auth-gate checks below see the new role
      accessToken = auth.accessToken;
    } else {
      // Refresh token is invalid / expired → clear stale cookies
      if (pathname.startsWith('/user/profile') || pathname.startsWith('/admin')) {
        const loginUrl = new URL('/user/login', request.url);
        loginUrl.searchParams.set('next', pathname);
        return clearAuthCookies(NextResponse.redirect(loginUrl));
      }
      // For public pages, just clear cookies and continue
      return clearAuthCookies(NextResponse.next());
    }
  }

  // ── Auth gate for protected routes ───────────────────────────────────
  if (pathname.startsWith('/user/profile') || pathname.startsWith('/admin')) {
    if (!accessToken && !refreshToken) {
      const loginUrl = new URL('/user/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Admin role check ─────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    const role = request.cookies.get(USER_ROLE_COOKIE)?.value;
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/forbidden', request.url));
    }
  }

  return refreshedResponse ?? NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Run middleware on every route EXCEPT Next.js internals and static files.
     * This ensures token refresh works on the home page, job detail pages, etc.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
