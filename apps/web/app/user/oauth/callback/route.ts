import { NextRequest, NextResponse } from 'next/server';
import { setSession } from '../../../../lib/session';
import type { AuthResponse } from '../../../../lib/types';

function getSafeNext(next: string | null) {
  return next && next.startsWith('/') ? next : '/';
}

function parseAuthPayload(payload: string | null): AuthResponse | null {
  if (!payload) {
    return null;
  }

  try {
    const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
    const parsed = JSON.parse(decoded) as Partial<AuthResponse>;

    if (
      typeof parsed.id === 'string' &&
      typeof parsed.username === 'string' &&
      typeof parsed.email === 'string' &&
      (parsed.role === 'user' || parsed.role === 'admin') &&
      typeof parsed.accessToken === 'string' &&
      typeof parsed.refreshToken === 'string'
    ) {
      return parsed as AuthResponse;
    }
  } catch {
    return null;
  }

  return null;
}

export async function GET(request: NextRequest) {
  const next = getSafeNext(request.nextUrl.searchParams.get('next'));
  const authPayload = parseAuthPayload(request.nextUrl.searchParams.get('payload'));

  if (!authPayload) {
    const loginUrl = new URL('/user/login', request.url);
    loginUrl.searchParams.set('error', 'Google login failed.');
    loginUrl.searchParams.set('next', next);
    return NextResponse.redirect(loginUrl);
  }

  await setSession(authPayload);
  return NextResponse.redirect(new URL(next, request.url));
}
