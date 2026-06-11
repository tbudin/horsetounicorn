import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, verifySession } from '@/lib/admin-auth';

/**
 * Two jobs:
 *   1. Inject an `x-pathname` request header so server-side layouts can
 *      conditionally render chrome (e.g. hide SiteHeader on /admin).
 *   2. Gate every /admin/* route behind a valid session cookie. The
 *      /admin/login page is excluded so the user can reach it.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', pathname);

  // Auth gate
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    const session = token ? await verifySession(token) : null;
    if (!session) {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Run on every non-static, non-api route so x-pathname is always set.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|opengraph-image|twitter-image).*)'],
};
