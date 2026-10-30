import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE_NAMES = ['codeddevs_session', 'session_token', 'session'];

function hasSessionCookie(request: NextRequest): boolean {
  return SESSION_COOKIE_NAMES.some((name) =>
    Boolean(request.cookies.get(name)?.value),
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = hasSessionCookie(request);

  const isAuthRoute = pathname === '/login';
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/website-content') ||
    pathname.startsWith('/insights') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/inquiries');

  // If user is authenticated and visits login, redirect to dashboard
  if (isAuthRoute && isAuthenticated) {
    const from = request.nextUrl.searchParams.get('from');
    const redirectUrl = from && from.startsWith('/') ? from : '/dashboard';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // If user is unauthenticated and visits a protected route, redirect to login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/website-content/:path*',
    '/insights/:path*',
    '/settings/:path*',
    '/inquiries/:path*',
    '/login',
  ],
};
