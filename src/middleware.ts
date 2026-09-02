import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, verifySessionToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const authSession = await verifySessionToken(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  const isAuthenticated = Boolean(authSession);

    const isPublicApiRoute =
      pathname === '/api/auth/login' ||
      pathname === '/api/auth/logout' ||
      (pathname === '/api/borrowings' &&
        request.method === 'GET' &&
        request.nextUrl.searchParams.get('status') === 'Dipinjam');

  if (pathname.startsWith('/api')) {
    if (isPublicApiRoute) {
      return NextResponse.next();
    }

    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.next();
  }

  if (pathname === '/login') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  }

  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
