import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { UserRole } from '@/src/types/roles';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Skip middleware for public paths
    if (
      path.startsWith('/_next') ||
      path.startsWith('/api') ||
      path.startsWith('/auth') ||
      path === '/favicon.ico'
    ) {
      return NextResponse.next();
    }

    // If no token, only redirect to signin if not already there
    if (!token && !path.startsWith('/auth/signin')) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    // Allow access to home page
    if (path === '/') {
      return NextResponse.next();
    }

    // If we have a token but no role, allow the request (role will be set by the session callback)
    if (!token?.role) {
      return NextResponse.next();
    }

    const role = token.role as UserRole;

    // Admin has access to everything
    if (role === 'admin') {
      return NextResponse.next();
    }

    // Trainer can only access attendance
    if (role === 'trainer') {
      // If already on attendance page, allow
      if (path.startsWith('/attendance')) {
        return NextResponse.next();
      }
      // If not on attendance page and not already being redirected, redirect
      if (!path.startsWith('/auth')) {
        return NextResponse.redirect(new URL('/attendance', req.url));
      }
    }

    // Administrative assistant can only access student information
    if (role === 'administrative_assistant') {
      // If already on student information page, allow
      if (path.startsWith('/studentinformation')) {
        return NextResponse.next();
      }
      // If not on student information page and not already being redirected, redirect
      if (!path.startsWith('/auth')) {
        return NextResponse.redirect(new URL('/studentinformation', req.url));
      }
    }

    // For any other case, allow the request
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Allow the middleware to handle the request
        return true;
      }
    },
  }
);

// Only run middleware on pages, not on API routes or static files
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
};
