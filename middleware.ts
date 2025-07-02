import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { UserRole } from './app/types/roles';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Always allow access to auth-related paths and public registration
    if (
      path.startsWith('/_next') ||
      path.startsWith('/api/auth') ||
      path.startsWith('/auth') ||      
      path === '/favicon.ico'
    ) {
      return NextResponse.next();
    }

    // If no token, allow the request to proceed (NextAuth will handle the redirect)
    if (!token) {
      return NextResponse.next();
    }

    // Allow access to home page
    if (path === '/') {
      return NextResponse.next();
    }

    const role = token.role as UserRole;

    // Admin has access to everything
    if (role === 'admin') {
      return NextResponse.next();
    }

    // Trainer can access attendance and tasks
    if (role === 'trainer') {
      if (path.startsWith('/attendance') || path.startsWith('/tasks') || path.startsWith('/projects')) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL('/attendance', req.url));
    }

    // Administrative assistant can access students and tasks
    if (role === 'administrative_assistant') {
      if (path.startsWith('/students') || path.startsWith('/tasks') || path.startsWith('/projects')) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL('/students', req.url));
    }

    // For any other case, redirect to home
    return NextResponse.redirect(new URL('/', req.url));
  },
  {
    callbacks: {
      authorized: ({ token }) => true, // Let the middleware handle authorization
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ]
};
