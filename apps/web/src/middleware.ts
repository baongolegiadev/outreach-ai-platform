import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_KEY } from '@/lib/auth-storage';

const authPaths = ['/login', '/signup'];
const protectedPrefix = '/app';

export function middleware(request: NextRequest): NextResponse {
  const token = request.cookies.get(AUTH_COOKIE_KEY)?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith(protectedPrefix) && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (authPaths.some((path) => pathname.startsWith(path)) && token) {
    return NextResponse.redirect(new URL('/app', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/login', '/signup'],
};
