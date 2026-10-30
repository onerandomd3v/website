import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const SESSION_COOKIE_NAMES = ['codeddevs_session', 'session_token', 'session'];

function hasSessionCookie(cookies: Map<string, string>): boolean {
  return SESSION_COOKIE_NAMES.some((name) => Boolean(cookies.get(name)));
}

function resolveRouteRedirect(
  pathname: string,
  cookies: Map<string, string>,
  fromParam?: string | null,
): string | null {
  const isAuthenticated = hasSessionCookie(cookies);
  const isAuthRoute = pathname === '/login';
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/website-content') ||
    pathname.startsWith('/insights') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/inquiries');

  if (isAuthRoute && isAuthenticated) {
    return fromParam && fromParam.startsWith('/') ? fromParam : '/dashboard';
  }

  if (isProtectedRoute && !isAuthenticated) {
    return `/login?from=${encodeURIComponent(pathname)}`;
  }

  return null;
}

describe('Middleware Route Protection Logic', () => {
  it('redirects unauthenticated users trying to access protected dashboard routes to /login', () => {
    const cookies = new Map<string, string>();
    const redirect = resolveRouteRedirect('/dashboard', cookies);
    assert.equal(redirect, '/login?from=%2Fdashboard');

    const settingsRedirect = resolveRouteRedirect('/settings', cookies);
    assert.equal(settingsRedirect, '/login?from=%2Fsettings');

    const insightsRedirect = resolveRouteRedirect('/insights', cookies);
    assert.equal(insightsRedirect, '/login?from=%2Finsights');
  });

  it('allows authenticated users with session cookie to access protected routes without redirection', () => {
    const cookies = new Map<string, string>([
      ['codeddevs_session', 'valid_token_xyz'],
    ]);
    const redirect = resolveRouteRedirect('/dashboard', cookies);
    assert.equal(redirect, null);
  });

  it('redirects authenticated users visiting /login to /dashboard', () => {
    const cookies = new Map<string, string>([
      ['session_token', 'valid_token_123'],
    ]);
    const redirect = resolveRouteRedirect('/login', cookies);
    assert.equal(redirect, '/dashboard');
  });

  it('redirects authenticated users visiting /login to their original target if from query is present', () => {
    const cookies = new Map<string, string>([['session', 'valid_token_abc']]);
    const redirect = resolveRouteRedirect(
      '/login',
      cookies,
      '/website-content',
    );
    assert.equal(redirect, '/website-content');
  });

  it('allows unauthenticated users to visit /login freely', () => {
    const cookies = new Map<string, string>();
    const redirect = resolveRouteRedirect('/login', cookies);
    assert.equal(redirect, null);
  });
});
